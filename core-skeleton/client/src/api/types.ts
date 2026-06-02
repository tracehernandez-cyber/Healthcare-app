export type ApiErrorBody = {
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiErrorBody };

export type Clinic = {
  id: string;
  name: string;
  createdAt: string;
};

export type Pathway = {
  id: string;
  clinicId: string;
  name: string;
  createdAt: string;
};

export type QueueEntry = {
  enrollmentId: string;
  patientId: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  createdAt: string;
  patientName: string;
  pathwayName: string;
};

export type User = {
  id: string;
  clinicId: string;
  email: string;
  role: "PATIENT" | "CLINICIAN" | "ADMIN";
  status: "INVITED" | "ACTIVE" | "DISABLED";
  createdAt: string;
};

export type Patient = {
  id: string;
  clinicId: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  user?: User;
  enrollments?: Enrollment[];
};

export type Enrollment = {
  id: string;
  patientId: string;
  pathwayId: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  createdAt: string;
  pathway?: Pathway;
  patient?: Patient;
};

export type OnboardResult = {
  clinic: Clinic;
  user: User;
  patient: Patient;
  enrollment: Enrollment & { pathway: Pathway; patient: Patient };
};

export type PatientDashboard = {
  patient: Patient;
  enrollments: Enrollment[];
};
