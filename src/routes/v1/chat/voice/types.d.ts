enum Gender {
	Male = "Male",
	Female = "Female",
	Other = "Other"
}

enum BloodType {
	A_POS = "A+",
	A_NEG = "A-",
	B_POS = "B+",
	B_NEG = "B-",
	AB_POS = "AB+",
	AB_NEG = "AB-",
	O_POS = "O+",
	O_NEG = "O-"
}

enum UnitType {
	ICU = "ICU",
	FloorUnit = "Floor Unit"
}

enum VitalStatus {
	Stable = "Stable",
	Critical = "Critical",
	Improving = "Improving",
	Deteriorating = "Deteriorating"
}

interface ContactInfo {
	name: string
	relation: string
	phone: string
	email?: string
}

interface Medication {
	name: string
	dosage: string
	frequency: string
	route: string // e.g., oral, IV, etc.
}

interface Allergy {
	allergen: string
	reaction: string
	severity: "Mild" | "Moderate" | "Severe"
}

interface VitalSign {
	HR: number
	BP: string
	RR: number
	O2Sat: number
	temp: number
	timestamp: Date
}

interface Order {
	description: string
	repeatable: boolean
	frequency?: string // e.g., 'daily', 'every 4 hours'
	lastCompleted?: Date
}

interface VentSettings {
	O2Percentage: number
	PEEP: number
	TV: number
	RR: number
}

interface Line {
	type: string // e.g., IV, central line
	location: string
}

interface Lab {
	name: string
	value: number | string
	referenceRange: string
	timestamp: Date
}

interface Diagnosis {
	description: string
	ICD10Code: string
}

interface Provider {
	name: string
	role: "Attending Physician" | "Nurse"
	phone: string
}

interface Input {
	input: number // in mL
	route: "oral" | "IV" | "NG" | "other"
	timestamp: Date
}

interface Output {
	output: number // in mL
	route: "urine" | "stool" | "vomit" | "blood" | "other"
	timestamp: Date
}

export interface Patient {
	id: string
	firstName: string
	lastName: string
	gender: Gender
	dateOfBirth: Date
	bloodType: BloodType
	admissionDate: Date
	chiefComplaint: string
	unitType: UnitType
	roomNumber: string
	diagnosis: Diagnosis[]
	medications: Medication[]
	allergies: Allergy[]
	contactInfo: ContactInfo[]
	vitalSigns: VitalSign[]
	orders: Order[]
	O2Therapy?: string // e.g., 'Intubated'
	ventSettings?: VentSettings
	lines: Line[]
	labs: Lab[]
	providers: Provider[]
	inputs: Input[]
	outputs: Output[]
	netFluidBalance: number
	vitalStatus: VitalStatus
}
