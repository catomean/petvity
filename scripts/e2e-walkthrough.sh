#!/usr/bin/env bash
# Exhaustive prod walkthrough: every feature, every user path.
# Output: one PASS/FAIL line per check; summary + exit code at the end.
set -u
BASE="${1:-https://petvity.orangecat.ch}"
STAMP=$(date +%s)
PASS=0; FAIL=0; FAILED=()

ok()   { PASS=$((PASS+1)); echo "PASS  $1"; }
bad()  { FAIL=$((FAIL+1)); FAILED+=("$1 — $2"); echo "FAIL  $1 — $2"; }

# jar per logged-in user
JARS=$(mktemp -d); trap 'rm -rf "$JARS"' EXIT

jq_() { python3 -c "import sys,json
try: d=json.load(sys.stdin)
except Exception: print(''); sys.exit(0)
cur=d
for k in '$1'.split('.'):
    if k=='': continue
    if isinstance(cur,list): cur=cur[int(k)]
    else: cur=cur.get(k) if isinstance(cur,dict) else None
    if cur is None: break
print('' if cur is None else cur)"; }

req() { # req <name> <expected_code> <method> <url> [jar] [json_body] -> body on stdout via $LAST_BODY
  local name=$1 exp=$2 method=$3 url=$4 jar=${5:-} body=${6:-}
  local args=(-s -o /tmp/e2e_body -w "%{http_code}" -X "$method" "$BASE$url")
  [ -n "$jar" ] && args+=(-b "$JARS/$jar" -c "$JARS/$jar")
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" -d "$body")
  local code; code=$(curl "${args[@]}")
  LAST_BODY=$(cat /tmp/e2e_body)
  if [ "$code" = "$exp" ]; then ok "$name"; else bad "$name" "expected $exp got $code: $(echo "$LAST_BODY" | head -c 160)"; fi
}

register() { # register <jar> <email> <name> [role]
  local jar=$1 email=$2 uname=$3 role=${4:-}
  local rolefield=""
  [ -n "$role" ] && rolefield=",\"intendedRole\":\"$role\""
  req "register $uname${role:+ ($role)}" 201 POST /api/account "" "{\"name\":\"$uname\",\"email\":\"$email\",\"password\":\"E2e-pass-$STAMP\"$rolefield}"
}

login() { # login <jar> <email> [password]
  local jar=$1 email=$2 pw=${3:-E2e-pass-$STAMP}
  rm -f "$JARS/$jar"
  local csrf; csrf=$(curl -s -c "$JARS/$jar" "$BASE/api/auth/csrf" | jq_ csrfToken)
  curl -s -b "$JARS/$jar" -c "$JARS/$jar" -X POST "$BASE/api/auth/callback/credentials" \
    --data-urlencode "csrfToken=$csrf" --data-urlencode "email=$email" --data-urlencode "password=$pw" -o /dev/null
  local role; role=$(curl -s -b "$JARS/$jar" "$BASE/api/auth/session" | jq_ user.role)
  [ -n "$role" ] && ok "login $email (role=$role)" || bad "login $email" "no session"
  SESSION_ROLE=$role
}

page() { # page <expected> <path>
  local exp=$1 path=$2 jar=${3:-}
  local args=(-s -o /dev/null -w "%{http_code}" "$BASE$path")
  [ -n "$jar" ] && args+=(-b "$JARS/$jar")
  local code; code=$(curl "${args[@]}")
  [ "$code" = "$exp" ] && ok "page $path" || bad "page $path" "expected $exp got $code"
}

E_OWNER="e2e-owner-$STAMP@petvity.orangecat.ch"
E_VET="e2e-vet-$STAMP@petvity.orangecat.ch"
E_SITTER="e2e-sitter-$STAMP@petvity.orangecat.ch"
E_GROOMER="e2e-groomer-$STAMP@petvity.orangecat.ch"
E_SELLER="e2e-seller-$STAMP@petvity.orangecat.ch"
E_ADOPTER="e2e-adopter-$STAMP@petvity.orangecat.ch"

echo "══ 1. Public pages (en/de/ar) ══"
for p in "" /features /pricing /about /species/dog /adopt /shop /pets/milo /pets/rosie; do
  page 200 "/en$p"
done
page 200 /de
page 200 /ar
page 200 /de/shop
page 200 /ar/adopt
page 200 /login
page 200 /register
page 200 /forgot-password
req "healthz" 200 GET /api/healthz
req "public pet api milo" 200 GET /api/public/pets/milo

echo "══ 2. Owner lifecycle ══"
register owner "$E_OWNER" "E2E Owner"
login owner "$E_OWNER"
req "account GET" 200 GET /api/account owner
req "account PATCH name" 200 PATCH /api/account owner '{"name":"E2E Owner Renamed"}'
req "create pet" 201 POST /api/pets owner '{"name":"Nimbus","species":"dog","breed":"Beagle","sex":"female","birthDate":"2023-05-01"}'
PET=$(echo "$LAST_BODY" | jq_ data.id)
req "list pets" 200 GET /api/pets owner
req "get pet" 200 GET "/api/pets/$PET" owner
req "log checkin" 201 POST "/api/health/metrics/$PET" owner '{"date":"'"$(date +%F)"'","weightGrams":11200,"temperatureCentidegrees":3850,"heartRateBpm":95,"energy":4,"mood":4,"anxiety":2,"socialization":4}'
req "get metrics" 200 GET "/api/health/metrics/$PET" owner
req "create record" 201 POST /api/health/records owner '{"petId":"'"$PET"'","type":"vet_visit","title":"E2E checkup","date":"'"$(date +%F)"'","notes":null}'
REC=$(echo "$LAST_BODY" | jq_ data.id)
req "patch record" 200 PATCH "/api/health/records/$REC" owner '{"title":"E2E checkup edited"}'
req "create vaccination" 201 POST /api/vaccinations owner '{"petId":"'"$PET"'","name":"Rabies","administeredDate":"2026-01-10","nextDueDate":"2027-01-10","status":"up_to_date"}'
VACC=$(echo "$LAST_BODY" | jq_ data.id)
req "patch vaccination" 200 PATCH "/api/vaccinations/$VACC" owner '{"status":"overdue"}'
req "create medication" 201 POST /api/medications owner '{"petId":"'"$PET"'","name":"E2E Med","startDate":"'"$(date +%F)"'","status":"active","dosage":null,"frequency":null,"endDate":null,"prescribedBy":null,"notes":null}'
MED=$(echo "$LAST_BODY" | jq_ data.id)
req "patch medication" 200 PATCH "/api/medications/$MED" owner '{"status":"completed"}'
req "make pet public" 200 PATCH "/api/pets/$PET" owner '{"isPublic":true,"handle":"e2e-nimbus-'"$STAMP"'"}'
req "public pet page" 200 GET "/api/public/pets/e2e-nimbus-$STAMP"
page 200 /portal/dashboard owner
page 200 "/portal/pets/$PET" owner
page 200 /portal/checkin owner
page 200 /portal/find owner
page 200 /portal/shop owner
page 200 /portal/orders owner
page 200 /portal/adopt owner
page 200 /portal/adoptions owner
page 200 /portal/settings owner
page 200 /portal/become-a-pro owner

echo "══ 3. Professionals (vet / sitter / groomer) ══"
register vet "$E_VET" "E2E Vet" veterinarian
login vet "$E_VET"
req "vet profile create" 201 POST /api/vets/me vet '{"specialty":"E2E medicine","clinicName":"E2E Clinic","city":"Zurich","country":"CH"}'
req "vet profile GET" 200 GET /api/vets/me vet
req "vet profile PATCH" 200 PATCH /api/vets/me vet '{"bio":"e2e vet bio"}'
register sitter "$E_SITTER" "E2E Sitter" pet_sitter
login sitter "$E_SITTER"
req "sitter profile create" 201 POST /api/sitters/me sitter '{"pricePerDay":3000,"services":"walking,daycare","city":"Zurich","country":"CH"}'
req "sitter availability block" 201 POST /api/availability sitter '{"startDate":"2027-09-01","endDate":"2027-09-03","reason":"e2e"}'
BLOCK=$(echo "$LAST_BODY" | jq_ data.id)
req "sitter availability list" 200 GET /api/availability sitter
register groomer "$E_GROOMER" "E2E Groomer" groomer
login groomer "$E_GROOMER"
req "groomer profile create" 201 POST /api/groomers/me groomer '{"salonName":"E2E Salon","priceFrom":4000,"services":"bath_brush","city":"Zurich","country":"CH"}'
req "groomer profile PATCH" 200 PATCH /api/groomers/me groomer '{"bio":"e2e groomer bio"}'
login owner "$E_OWNER"
req "browse vets" 200 GET "/api/vets?city=Zurich" owner
echo "$LAST_BODY" | grep -q "E2E Clinic" && ok "vet visible in browse" || bad "vet visible in browse" "not found"
req "browse sitters" 200 GET "/api/sitters?city=Zurich" owner
echo "$LAST_BODY" | grep -q "E2E Sitter" && ok "sitter visible in browse" || bad "sitter visible in browse" "not found"
req "browse groomers" 200 GET "/api/groomers?city=Zurich" owner
echo "$LAST_BODY" | grep -q "E2E Salon" && ok "groomer visible in browse" || bad "groomer visible in browse" "not found"

echo "══ 4. Booking lifecycle + conflicts + reviews ══"
SITTER_ID=$(curl -s -b "$JARS/sitter" "$BASE/api/auth/session" | jq_ user.id)
VET_ID=$(curl -s -b "$JARS/vet" "$BASE/api/auth/session" | jq_ user.id)
GROOMER_ID=$(curl -s -b "$JARS/groomer" "$BASE/api/auth/session" | jq_ user.id)
req "book sitter" 201 POST /api/bookings owner '{"petId":"'"$PET"'","professionalId":"'"$SITTER_ID"'","startDate":"2027-08-01T09:00:00.000Z","endDate":"2027-08-04T17:00:00.000Z"}'
BOOKING=$(echo "$LAST_BODY" | jq_ data.id)
req "overlap rejected" 409 POST /api/bookings owner '{"petId":"'"$PET"'","professionalId":"'"$SITTER_ID"'","startDate":"2027-08-02T09:00:00.000Z","endDate":"2027-08-05T17:00:00.000Z"}'
req "blocked dates rejected" 409 POST /api/bookings owner '{"petId":"'"$PET"'","professionalId":"'"$SITTER_ID"'","startDate":"2027-09-01T09:00:00.000Z","endDate":"2027-09-02T17:00:00.000Z"}'
req "busy endpoint" 200 GET "/api/bookings/busy?professionalId=$SITTER_ID" owner
echo "$LAST_BODY" | grep -q "2027-08-01" && ok "busy contains booking" || bad "busy contains booking" "missing"
req "sitter sees booking" 200 GET /api/bookings sitter
echo "$LAST_BODY" | grep -q "$BOOKING" && ok "booking in sitter list" || bad "booking in sitter list" "missing"
req "sitter confirms" 200 PATCH "/api/bookings/$BOOKING" sitter '{"status":"confirmed"}'
req "sitter completes" 200 PATCH "/api/bookings/$BOOKING" sitter '{"status":"completed"}'
req "owner reviews" 201 POST /api/reviews owner '{"bookingId":"'"$BOOKING"'","rating":4,"comment":"e2e review"}'
req "double review rejected" 409 POST /api/reviews owner '{"bookingId":"'"$BOOKING"'","rating":5,"comment":"again"}'
req "rating on card" 200 GET "/api/sitters?city=Zurich" owner
echo "$LAST_BODY" | grep -q '"avgRating": *4' && ok "avg rating shows 4" || bad "avg rating shows 4" "not found"
req "book vet" 201 POST /api/bookings owner '{"petId":"'"$PET"'","professionalId":"'"$VET_ID"'","startDate":"2027-08-10T10:00:00.000Z","endDate":"2027-08-10T11:00:00.000Z"}'
VBOOKING=$(echo "$LAST_BODY" | jq_ data.id)
req "vet declines" 200 PATCH "/api/bookings/$VBOOKING" vet '{"status":"cancelled"}'
req "book groomer" 201 POST /api/bookings owner '{"petId":"'"$PET"'","professionalId":"'"$GROOMER_ID"'","startDate":"2027-08-12T10:00:00.000Z","endDate":"2027-08-12T11:00:00.000Z"}'
GBOOKING=$(echo "$LAST_BODY" | jq_ data.id)
req "owner cancels own booking" 200 PATCH "/api/bookings/$GBOOKING" owner '{"status":"cancelled"}'

echo "══ 5. Seller + shop lifecycle ══"
register seller "$E_SELLER" "E2E Seller"
login seller "$E_SELLER"
req "seller profile create" 201 POST /api/sellers/me seller '{"displayName":"E2E Store","bio":"e2e"}'
req "seller product create" 201 POST /api/products seller '{"name":"E2E Chew Toy","priceCents":990,"stock":5,"category":"toys","description":"e2e"}'
PROD=$(echo "$LAST_BODY" | jq_ data.id)
req "seller product patch" 200 PATCH "/api/products/$PROD" seller '{"priceCents":1090}'
req "product visible publicly" 200 GET /api/products
echo "$LAST_BODY" | grep -q "E2E Chew Toy" && ok "product in catalog" || bad "product in catalog" "missing"
SHIP='"shippingName":"E2E Buyer","shippingLine1":"Bahnhofstrasse 1","shippingPostalCode":"8001","shippingCity":"Zurich","shippingCountry":"CH"'
req "order without an address is rejected" 400 POST /api/orders owner '{"items":[{"productId":"'"$PROD"'","quantity":1}]}'
req "owner places order" 201 POST /api/orders owner '{"items":[{"productId":"'"$PROD"'","quantity":2}],'"$SHIP"'}'
ORDER=$(echo "$LAST_BODY" | jq_ data.id)
req "stock decremented" 200 GET /api/products
echo "$LAST_BODY" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print([p['stock'] for p in d if p['id']=='$PROD'])" | grep -q "\[3\]" && ok "stock 5->3" || bad "stock 5->3" "wrong stock"
req "seller sees order" 200 GET /api/orders/seller seller
echo "$LAST_BODY" | grep -q "$ORDER" && ok "order in seller list" || bad "order in seller list" "missing"
echo "$LAST_BODY" | grep -q "Bahnhofstrasse 1" && ok "seller can see where to ship" || bad "seller can see where to ship" "no address"
req "owner cancels order" 200 PATCH "/api/orders/$ORDER" owner '{"status":"cancelled"}'
req "stock restored" 200 GET /api/products
echo "$LAST_BODY" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print([p['stock'] for p in d if p['id']=='$PROD'])" | grep -q "\[5\]" && ok "stock restored to 5" || bad "stock restored to 5" "wrong stock"
page 200 /portal/my-products seller
page 200 /portal/my-products/orders seller

echo "══ 6. Adoption lifecycle ══"
login owner "$E_OWNER"
req "create listing" 201 POST /api/adoptions owner '{"petId":"'"$PET"'","title":"E2E adoption","description":"e2e listing","location":"Zurich","feeCents":null,"requiresExperience":false}'
LISTING=$(echo "$LAST_BODY" | jq_ data.id)
req "listing public" 200 GET "/api/adoptions/$LISTING"
page 200 "/en/adopt/$LISTING"
register adopter "$E_ADOPTER" "E2E Adopter"
login adopter "$E_ADOPTER"
req "apply" 201 POST "/api/adoptions/$LISTING/apply" adopter '{"message":"e2e application","experience":"some","housingType":"apartment"}'
req "double apply rejected" 409 POST "/api/adoptions/$LISTING/apply" adopter '{"message":"again"}'
login owner "$E_OWNER"
req "owner sees applications" 200 GET "/api/adoptions/$LISTING/applications" owner
APP_ID=$(echo "$LAST_BODY" | jq_ data.0.id)
req "approve application" 200 PATCH "/api/adoptions/$LISTING/applications" owner '{"applicationId":"'"$APP_ID"'","status":"approved"}'
req "mark adopted" 200 PATCH "/api/adoptions/$LISTING" owner '{"status":"adopted"}'

echo "══ 7. Settings / auth / role upgrade ══"
req "change password" 200 PATCH /api/account owner '{"currentPassword":"E2e-pass-'"$STAMP"'","newPassword":"E2e-pass2-'"$STAMP"'"}'
login owner "$E_OWNER" "E2e-pass2-$STAMP"
req "forgot password" 200 POST /api/auth/forgot-password "" '{"email":"'"$E_OWNER"'"}'
req "account export" 200 GET /api/account/export owner
req "locale patch" 200 PATCH /api/account/locale owner '{"locale":"de"}'
req "adopter becomes sitter" 200 POST /api/account/role adopter '{"role":"pet_sitter"}'
login adopter "$E_ADOPTER"
[ "$SESSION_ROLE" = "pet_sitter" ] && ok "role upgrade reflected at login" || bad "role upgrade reflected at login" "role=$SESSION_ROLE"

echo "══ 8. Cleanup (self-serve account deletion) ══"
req "delete record" 200 DELETE "/api/health/records/$REC" owner
req "delete vaccination" 200 DELETE "/api/vaccinations/$VACC" owner
req "delete medication" 200 DELETE "/api/medications/$MED" owner
for u in vet sitter groomer seller adopter; do
  req "delete account ($u)" 200 DELETE /api/account "$u" '{"confirm":"DELETE","currentPassword":"E2e-pass-'"$STAMP"'"}'
done
req "delete account (owner)" 200 DELETE /api/account owner '{"confirm":"DELETE","currentPassword":"E2e-pass2-'"$STAMP"'"}'

echo
echo "══════════════════════════════════"
echo "PASS: $PASS   FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  printf '%s\n' "${FAILED[@]}"
  exit 1
fi
