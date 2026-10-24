const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Blood components a requester can ask for. Inventory is still tracked per blood type only,
// so fulfilment deducts from that blood type's stock whatever the component.
const BLOOD_COMPONENTS = ['Whole Blood', 'Red Blood Cells', 'Plasma', 'Platelets'];

module.exports = { BLOOD_TYPES, BLOOD_COMPONENTS };
