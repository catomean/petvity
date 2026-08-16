/**
 * Countries, re-exported from `commercekit`.
 *
 * The list and the `Intl.DisplayNames` lookup are not Petvity-specific — every
 * shop in the fleet needs the same thing — so they live in the package. This
 * file stays as the import path the app already uses.
 */

export {
  COUNTRY_CODES,
  countryName,
  countryOptions,
  isCountryCode,
  type CountryCode,
} from "@/packages/commercekit/src/address";
