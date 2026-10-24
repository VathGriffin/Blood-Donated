import { BLOOD_TYPES } from './inventory';

// ABO/Rh red-cell compatibility: which patients each donor type can give red cells to.
// A general guide only. Plasma and platelets follow different rules, and hospitals always
// confirm compatibility with their own crossmatch testing before a transfusion.
export const GIVES_TO = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

// The reverse: which donor types a patient of each type can receive red cells from.
export const RECEIVES_FROM = Object.fromEntries(
  BLOOD_TYPES.map((t) => [t, BLOOD_TYPES.filter((d) => GIVES_TO[d].includes(t))])
);
