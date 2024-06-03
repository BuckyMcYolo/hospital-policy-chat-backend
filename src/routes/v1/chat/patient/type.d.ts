type Allergy = {
	name: string
	reaction: string
	severity: "mild" | "moderate" | "severe"
}

type Medication = {
	name: string
	dose: string
	frequency: string
}

type MedicalHistory = {
	condition: string
	dateStarted: Date
}

type Surgery = {
	name: string
	date: Date
}

type FamilyHistory = {
	condition: string
	relative: string
}

type SocialHistory = {
	status: "single" | "married" | "divorced" | "widowed"
	occupation: string
	livingSituation:
		| "alone"
		| "with family"
		| "with friends"
		| "in a nursing home"
		| "in an assisted living facility"
	tobaccoUse: "never" | "current" | "former"
	alcoholUse: "never" | "current" | "former"
	drugUse: "never" | "current" | "former"
}

type Immunization = {
	name: string
	date: Date
}

type Appointment = {
	date: Date
	time: string
	reason: string
	doctor: string
	location: string
}

type LabResult = {
	test: string
	value: string
	unit: string
	referenceRange: string
}

type Lab = {
	date: Date
	type: string
	results: LabResult[]
}

type Imaging = {
	date: Date
	type: string
	results: string
}

type Procedure = {
	date: Date
	type: string
	results: string
}

type MedicationOrder = {
	date: Date
	time: string
	prn: boolean
	medication: Medication
	type: "medication"
}

type ImagingOrder = {
	date: Date
	time: string
	type: "X-ray" | "CT" | "MRI" | "Ultrasound" | "Bronchoscopy" | "Other"
}

type LabOrder = {
	date: Date
	time: string
	type:
		| "CBC"
		| "CMP"
		| "Lipid Panel"
		| "Thyroid Panel"
		| "Hemoglobin A1c"
		| "Pulmonary Function Test"
		| "Basic Metabolic Panel"
		| "Urinalysis"
		| "H. Pylori Test"
		| "Other"
}

type ProcedureOrder = {
	date: Date
	time: string
	type: "EKG" | "Colonoscopy" | "Endoscopy" | "Other"
}

type Order = {
	date: Date
	time: string
	type: MedicationOrder | ImagingOrder | LabOrder | ProcedureOrder
	status: "pending" | "completed" | "cancelled"
	priority: "low" | "medium" | "high"
}

export type Patient = {
	name: string
	dateOfBirth: Date
	address: string
	phone: string
	email: {
		primary: string | null
		secondary: string | null
	} | null
	emergencyContact: {
		name: string
		phone: string
		relationship: string
	} | null
	insurance: {
		provider: string
		policyNumber: string
		expirationDate?: Date
	}
	allergies: Allergy[]
	medications: Medication[]
	medicalHistory: MedicalHistory[]
	surgeries: Surgery[]
	familyHistory: FamilyHistory[]
	socialHistory: SocialHistory
	immunizations: Immunization[]
	appointments: Appointment[]
	labs: Lab[]
	imaging: Imaging[]
	procedures: Procedure[]
	orders?: Order[]
	notes: string
}

export interface Admission extends Patient {
	admissionDate: Date
	expectedDischarge: Date | null
	admissionReason: string
	admissionReasonPriority: "high" | "medium" | "low"
	admissionLocation: string
	admittingDoctor: string
	attendingDoctor: string
	floor: string
	room: string
}
