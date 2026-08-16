#!/usr/bin/env bash
# Where do the two local shops actually overlap, concretely?
E=/home/g/dev/evig/src
P=/home/g/dev/petvity

echo "── money representation ──"
echo -n "evig  decimal/numeric price columns: "
grep -rhoE "(decimal|numeric)\('price[a-z_]*'" $E/db/schema/ 2>/dev/null | wc -l
echo -n "evig  integer cents columns:         "
grep -rhoE "integer\('[a-z_]*cents'\)" $E/db/schema/ 2>/dev/null | wc -l
echo -n "petvity integer cents columns:       "
grep -rhoE "integer\(\"[a-z_]*cents\"\)" $P/lib/db/schema.ts 2>/dev/null | wc -l

echo
echo "── country / address handling ──"
echo -n "evig  country lists or selects: "
grep -rli "country" $E/config $E/lib 2>/dev/null | wc -l
echo -n "petvity country SSOT:          "
ls $P/lib/config/countries.ts >/dev/null 2>&1 && echo "1 (added today)" || echo 0

echo
echo "── cart implementations ──"
echo -n "evig  cart files:    "
grep -rli "usecart\|addtocart\|cartitem" $E 2>/dev/null | grep -v node_modules | wc -l
echo -n "petvity cart files:  "
grep -rli "usecart\|addtocart\|cartitem" $P/lib $P/components $P/app 2>/dev/null | wc -l

echo
echo "── stock / inventory reservation ──"
echo -n "evig  reservation logic: "
grep -rli "reserve\|stock" $E/lib $E/features 2>/dev/null | wc -l
echo -n "petvity:                 "
grep -rli "stock" $P/lib $P/app/api 2>/dev/null | wc -l

echo
echo "── guest / anonymous checkout ──"
echo -n "evig  guest checkout refs: "
grep -rli "guest" $E 2>/dev/null | grep -v node_modules | wc -l
echo -n "petvity guest checkout:    "
grep -rli "guest" $P/lib $P/app 2>/dev/null | wc -l
