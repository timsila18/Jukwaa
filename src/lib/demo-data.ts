export type Role =
  | "Candidate"
  | "Campaign Manager"
  | "Constituency Coordinator"
  | "Ward Coordinator"
  | "Village Coordinator"
  | "Volunteer"
  | "Polling Agent"
  | "Media Team"
  | "Data Clerk"
  | "Admin";

export type SupportLevel =
  | "Strong Supporter"
  | "Leaning Supporter"
  | "Undecided"
  | "Opponent"
  | "Unknown";

export type Supporter = {
  id: string;
  fullName: string;
  phoneNumber: string;
  gender: "Female" | "Male" | "Other";
  ageGroup: "18-24" | "25-34" | "35-44" | "45-59" | "60+";
  occupation: string;
  county: string;
  constituency: string;
  ward: string;
  village: string;
  pollingStation: string;
  supportLevel: SupportLevel;
  keyIssue: string;
  volunteerInterest: boolean;
  consentToContact: boolean;
  notes: string;
  registeredBy: string;
  createdAt: string;
};

export type PollingStation = {
  id: string;
  name: string;
  county: string;
  constituency: string;
  ward: string;
  village: string;
  registeredVoters: number;
};

export type CampaignUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  geography: string;
  status: "Active" | "Invited" | "Suspended";
};

export type VolunteerStatus = "Active" | "Inactive" | "Suspended" | "Pending Approval";
export type TaskStatus = "Pending" | "In Progress" | "Completed" | "Overdue";
export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";
export type AgentStatus = "Assigned" | "Confirmed" | "Checked In" | "Active" | "Offline" | "Completed";
export type IncidentCategory = "Violence" | "Intimidation" | "Voter Suppression" | "Missing Materials" | "Delayed Opening" | "Agent Access Issues" | "Technology Failure" | "Security Incident" | "Other";
export type IncidentStatus = "Open" | "In Progress" | "Resolved";
export type FormType = "Form 35" | "Form 36" | "Form 37" | "Form 38" | "Country-specific Equivalent";
export type VerificationStatus = "Pending" | "Verified" | "Rejected";
export type CampaignStatus = "Draft" | "Active" | "Suspended" | "Completed" | "Archived";
export type InvitationStatus = "Pending" | "Accepted" | "Expired" | "Revoked";
export type ElectionType = "Presidential" | "Governor" | "Senator" | "Women Representative" | "MP" | "MCA" | "Party Election" | "Referendum";
export type SubscriptionPlan = "Starter" | "Professional" | "Advanced" | "Enterprise";
export type SubscriptionStatus = "Trial" | "Active" | "Past Due" | "Expired" | "Cancelled";
export type PaymentMethod = "M-Pesa STK Push" | "Paybill" | "Card Payment" | "Bank Transfer";
export type FinanceCategory = "Fuel" | "Events" | "Salaries" | "Marketing" | "Printing" | "Logistics" | "Accommodation" | "Security" | "Media" | "Miscellaneous";
export type DonorType = "Individual" | "Corporate" | "Event Contribution";
export type FundraisingStatus = "Draft" | "Active" | "Paused" | "Closed";
export type DocumentCategory = "Campaign Document" | "Contract" | "Budget" | "Training Material" | "Result Form" | "Regulation";

export type Volunteer = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  gender: "Female" | "Male" | "Other";
  age: number;
  occupation: string;
  ward: string;
  village: string;
  recruitmentSource: string;
  assignedSupervisor: string;
  status: VolunteerStatus;
  joinDate: string;
  notes: string;
};

export type VolunteerTask = {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: TaskStatus;
  completionNotes: string;
};

export type FieldVisit = {
  id: string;
  volunteer: string;
  date: string;
  startTime: string;
  endTime: string;
  village: string;
  pollingStation: string;
  visitPurpose: string;
  supportersEngaged: number;
  notes: string;
  latitude: number;
  longitude: number;
  photos: number;
};

export type IntelligenceReport = {
  id: string;
  title: string;
  category: "Opponent Activity" | "Community Mood" | "Local Influencers" | "Emerging Issues" | "Campaign Opportunity" | "Security Concern" | "Political Risk";
  location: string;
  description: string;
  urgency: PriorityLevel;
  submittedBy: string;
  photos: number;
  createdAt: string;
};

export type CommunityIssue = {
  id: string;
  title: string;
  category: "Roads" | "Water" | "Education" | "Healthcare" | "Agriculture" | "Youth Employment" | "Security" | "Electricity" | "Business" | "Environment" | "Other";
  description: string;
  ward: string;
  village: string;
  pollingStation: string;
  mentions: number;
  priority: PriorityLevel;
  status: "Open" | "Under Review" | "Addressed";
};

export type CampaignEvent = {
  id: string;
  title: string;
  type: "Rally" | "Town Hall" | "Community Meeting" | "Fundraiser" | "Press Conference" | "Volunteer Training";
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  expectedAttendance: number;
  organizer: string;
  description: string;
  actualAttendance: number;
  newSupporters: number;
};

export type PollingAgent = {
  id: string;
  fullName: string;
  phoneNumber: string;
  nationalId: string;
  pollingStation: string;
  ward: string;
  manager: string;
  status: AgentStatus;
  lastSeen: string;
  latitude: number;
  longitude: number;
};

export type TurnoutUpdate = {
  id: string;
  pollingStation: string;
  interval: string;
  maleVoters: number;
  femaleVoters: number;
  totalTurnout: number;
  turnoutPercentage: number;
  submittedBy: string;
};

export type ElectionIncident = {
  id: string;
  title: string;
  category: IncidentCategory;
  description: string;
  pollingStation: string;
  urgency: PriorityLevel;
  status: IncidentStatus;
  submittedBy: string;
  assignedTo: string;
  photos: number;
  videos: number;
  latitude: number;
  longitude: number;
  createdAt: string;
};

export type ElectionForm = {
  id: string;
  formType: FormType;
  pollingStation: string;
  uploadedBy: string;
  uploadedAt: string;
  qualityStatus: VerificationStatus;
  duplicateCheck: "Clear" | "Possible Duplicate";
  missingFields: string[];
  suspicious: boolean;
};

export type PollingResult = {
  id: string;
  pollingStation: string;
  candidate: string;
  votes: number;
  rejectedVotes: number;
  totalVotes: number;
  verificationStatus: VerificationStatus;
  uploadedBy: string;
};

export type ElectionAlert = {
  id: string;
  title: string;
  body: string;
  alertType: "Agent" | "Turnout" | "Incident" | "Results" | "PVT";
  severity: PriorityLevel;
  pollingStation: string;
  status: "Unread" | "Read" | "Archived";
  createdAt: string;
};

export type CandidateProfile = {
  id: string;
  tenantId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  gender: "Female" | "Male" | "Other";
  dateOfBirth: string;
  profilePhoto: string;
  politicalParty: string;
  positionContesting: string;
  county: string;
  constituency: string;
  ward: string;
  campaignName: string;
  slogan: string;
  biography: string;
  campaignStartDate: string;
  campaignEndDate: string;
  activeStatus: CampaignStatus;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceOwnership = {
  workspace: string;
  candidate: string;
  campaignManager: string;
  ownershipStatus: "Compliant" | "Needs Manager" | "Suspended";
  candidateLocked: boolean;
  managerReplacePolicy: string;
};

export type Invitation = {
  id: string;
  candidateId: string;
  invitedName: string;
  invitedPhone: string;
  invitedEmail: string;
  role: Role;
  invitedBy: string;
  invitationCode: string;
  status: InvitationStatus;
  expiryDate: string;
  createdAt: string;
};

export type ElectionCycle = {
  id: string;
  electionName: string;
  country: string;
  electionType: ElectionType;
  electionDate: string;
  status: CampaignStatus;
};

export type CandidateBranding = {
  logo: string;
  campaignColors: string[];
  candidatePhoto: string;
  slogan: string;
  campaignBanner: string;
  socialLinks: Record<string, string>;
};

export type TeamHierarchyNode = {
  level: string;
  role: Role;
  name: string;
  parent?: string;
  status: "Approved" | "Pending Approval" | "Suspended";
  members: number;
};

export type WorkspaceSubscription = {
  id: string;
  plan: SubscriptionPlan;
  startDate: string;
  expiryDate: string;
  status: SubscriptionStatus;
  userLimit: number;
  volunteerLimit: number;
  pollingAgentLimit: number;
  storageGb: number;
};

export type FeatureEntitlements = {
  aiAccess: boolean;
  smsAccess: boolean;
  whatsappAccess: boolean;
  pollingAgentLimit: number;
  storageLimitGb: number;
  userLimit: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  plan: SubscriptionPlan;
  amountKes: number;
  status: "Draft" | "Issued" | "Paid" | "Overdue" | "Void";
  dueDate: string;
};

export type PaymentRecord = {
  id: string;
  method: PaymentMethod;
  amountKes: number;
  status: "Pending" | "Confirmed" | "Failed";
  reference: string;
  createdAt: string;
};

export type SecurityEvent = {
  id: string;
  user: string;
  event: "Login" | "Failed Login" | "Password Updated" | "Device Added" | "Session Revoked";
  device: string;
  ipAddress: string;
  createdAt: string;
};

export type AiRecommendation = {
  id: string;
  title: string;
  description: string;
  impactScore: number;
  category: "Risk" | "Opportunity" | "Action" | "Report";
  source: string;
};

export type AiContentAsset = {
  id: string;
  type: "Rally Speech" | "Social Caption" | "Campaign Message" | "Press Statement" | "Volunteer Message" | "Event Invitation";
  title: string;
  audience: string;
  status: "Draft" | "Approved" | "Published";
};

export type Donation = {
  id: string;
  donorName: string;
  donorType: DonorType;
  phone: string;
  email: string;
  amountKes: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
};

export type Expense = {
  id: string;
  vendor: string;
  category: FinanceCategory;
  amountKes: number;
  date: string;
  status: "Pending Approval" | "Approved" | "Paid";
  receiptUrl: string;
  approvedBy: string;
};

export type BudgetLine = {
  id: string;
  category: FinanceCategory;
  budgetedKes: number;
  actualKes: number;
};

export type FundraisingCampaign = {
  id: string;
  title: string;
  goalAmountKes: number;
  raisedKes: number;
  targetDate: string;
  description: string;
  status: FundraisingStatus;
};

export type MpesaPaymentSetting = {
  paybillNumber: string;
  accountReferenceFormat: string;
  callbackUrl: string;
  stkPushReady: boolean;
  paybillReady: boolean;
  tillReady: boolean;
};

export type MpesaTransactionLog = {
  id: string;
  purpose: "Donation" | "Subscription" | "Fundraising";
  phone: string;
  amountKes: number;
  method: "STK Push" | "Paybill" | "Till Number";
  accountReference: string;
  checkoutRequestId: string;
  status: "Pending" | "Confirmed" | "Failed";
  createdAt: string;
};

export type PredictiveInsight = {
  id: string;
  metric: string;
  estimate: number;
  label: string;
  caveat: string;
};

export type ScenarioPlan = {
  id: string;
  title: string;
  turnoutShift: number;
  volunteerIncrease: number;
  additionalSpendKes: number;
  projectedImpact: string;
};

export type CampaignDocument = {
  id: string;
  title: string;
  category: DocumentCategory;
  version: string;
  permission: "Candidate Only" | "Managers" | "All Team";
  updatedAt: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  category: "Training Guide" | "SOP" | "Campaign Manual" | "Election Regulation" | "FAQ";
  audience: string;
  updatedAt: string;
};

export type CommunicationRoom = {
  id: string;
  title: string;
  livekitRoomName: string;
  purpose: "Command Briefing" | "Volunteer Coordination" | "Ward Town Hall" | "Candidate Broadcast";
  status: "Scheduled" | "Live" | "Ended";
  audience: string;
  scheduledAt: string;
  host: string;
  participants: number;
};

export type CommunicationMessage = {
  id: string;
  channel: "Solco Meeting" | "Campaign Chat" | "Broadcast SMS" | "WhatsApp";
  subject: string;
  sender: string;
  audience: string;
  status: "Draft" | "Queued" | "Sent" | "Delivered";
  sentAt: string;
};

export type SolcoIntegrationStatus = {
  workspaceUrl: string;
  livekitUrl: string;
  status: "Ready" | "Needs Env";
  tokenEndpoint: string;
  meetingPath: string;
};

export type PoliticalParty = {
  registerSerial: number;
  name: string;
  abbreviation: string;
  displayName: string;
  featuredRank?: number;
};

export type PartyAffiliationOption = {
  id: string;
  displayName: string;
  affiliationType: "Independent" | "Registered Party";
  party?: PoliticalParty;
};

export type CandidatePositionScope = {
  id: string;
  displayName: string;
  geographyLevel: "National" | "County" | "Constituency" | "Ward";
  description: string;
};

export const politicalParties: PoliticalParty[] = [
  { registerSerial: 13, name: "United Democratic Alliance", abbreviation: "UDA", featuredRank: 1 },
  { registerSerial: 16, name: "Orange Democratic Movement", abbreviation: "ODM", featuredRank: 2 },
  { registerSerial: 91, name: "Democracy for the Citizens Party", abbreviation: "DCP", featuredRank: 3 },
  { registerSerial: 10, name: "Wiper Democratic Movement-Kenya / Wiper Patriotic Front", abbreviation: "WDM-K / WPF", featuredRank: 4 },
  { registerSerial: 73, name: "Democratic Action Party-Kenya", abbreviation: "DAP-K", featuredRank: 5 },
  { registerSerial: 55, name: "Maendeleo Chap Chap", abbreviation: "MCCP", featuredRank: 6 },
  { registerSerial: 22, name: "National Rainbow Coalition", abbreviation: "NARC", featuredRank: 7 },
  { registerSerial: 1, name: "People's Liberation Party", abbreviation: "PLP" },
  { registerSerial: 2, name: "The National Vision Party", abbreviation: "NVP" },
  { registerSerial: 3, name: "Labour Party of Kenya", abbreviation: "LPK" },
  { registerSerial: 4, name: "The Democratic Union", abbreviation: "TDU" },
  { registerSerial: 5, name: "Party of Independent Candidate of Kenya", abbreviation: "PICK" },
  { registerSerial: 6, name: "Devolution Empowerment Party", abbreviation: "DEP" },
  { registerSerial: 7, name: "Kenya National Congress", abbreviation: "KNC" },
  { registerSerial: 8, name: "Mazingira Green Party", abbreviation: "MGP" },
  { registerSerial: 9, name: "Kenya Moja Movement Party", abbreviation: "KMM" },
  { registerSerial: 11, name: "Democratic Party of Kenya", abbreviation: "DP" },
  { registerSerial: 12, name: "Party of National Unity", abbreviation: "PNU" },
  { registerSerial: 14, name: "Agano National Party", abbreviation: "ANP" },
  { registerSerial: 15, name: "Kenya Social Congress", abbreviation: "KSC" },
  { registerSerial: 17, name: "People's Party of Kenya", abbreviation: "PPK" },
  { registerSerial: 18, name: "Forum for Restoration of Democracy-Kenya", abbreviation: "FORD-KENYA" },
  { registerSerial: 19, name: "Progressive Party of Kenya", abbreviation: "PPOK" },
  { registerSerial: 20, name: "Jubilee Party", abbreviation: "JP" },
  { registerSerial: 21, name: "Maendeleo Democratic Party", abbreviation: "MDP" },
  { registerSerial: 23, name: "Kenya African Democratic Union-Asili", abbreviation: "KADU-ASILI" },
  { registerSerial: 24, name: "Kenya Patriots Party", abbreviation: "KPP" },
  { registerSerial: 25, name: "Communist Party of Kenya", abbreviation: "CPK" },
  { registerSerial: 26, name: "Kenya African National Union", abbreviation: "KANU" },
  { registerSerial: 27, name: "Safina Party", abbreviation: "SAFINA" },
  { registerSerial: 28, name: "Chama Cha Uzalendo", abbreviation: "CCU" },
  { registerSerial: 29, name: "National Agenda Party of Kenya", abbreviation: "NAP-K" },
  { registerSerial: 30, name: "People's Empowerment Party", abbreviation: "PEP" },
  { registerSerial: 31, name: "Peoples Democratic Party", abbreviation: "PDP" },
  { registerSerial: 32, name: "The New Democrats", abbreviation: "TND" },
  { registerSerial: 33, name: "United Democratic Movement", abbreviation: "UDM" },
  { registerSerial: 34, name: "Shirikisho Party of Kenya", abbreviation: "SPK" },
  { registerSerial: 35, name: "Party of Democratic Unity", abbreviation: "PDU" },
  { registerSerial: 36, name: "Umoja na Maendeleo Party", abbreviation: "UMP" },
  { registerSerial: 37, name: "United Party of Independent Alliance", abbreviation: "UPIA" },
  { registerSerial: 38, name: "Farmers Party", abbreviation: "FP" },
  { registerSerial: 39, name: "Economic Freedom Party", abbreviation: "EFP" },
  { registerSerial: 40, name: "Federal Party of Kenya", abbreviation: "FPK" },
  { registerSerial: 41, name: "Muungano Party", abbreviation: "MP" },
  { registerSerial: 42, name: "The National Party", abbreviation: "TNP" },
  { registerSerial: 43, name: "Jirani Mzalendo Asili Party of Kenya", abbreviation: "J-MAPK" },
  { registerSerial: 44, name: "Chama Cha Mashinani", abbreviation: "CCM" },
  { registerSerial: 45, name: "Alliance for Change", abbreviation: "AFC" },
  { registerSerial: 46, name: "Forum For Republican Democracy-Asili", abbreviation: "FORD" },
  { registerSerial: 47, name: "Republican Liberty Party", abbreviation: "RLP" },
  { registerSerial: 48, name: "Roots Party of Kenya", abbreviation: "RPK" },
  { registerSerial: 49, name: "Ubuntu People's Forum", abbreviation: "UPF" },
  { registerSerial: 50, name: "Amani National Congress", abbreviation: "ANC" },
  { registerSerial: 51, name: "Devolution Party of Kenya", abbreviation: "DPK" },
  { registerSerial: 52, name: "United Democratic Party", abbreviation: "UDP" },
  { registerSerial: 53, name: "Kenya Reform Party", abbreviation: "KRP" },
  { registerSerial: 54, name: "People's Trust Party", abbreviation: "PTP" },
  { registerSerial: 56, name: "Democratic Congress", abbreviation: "DC" },
  { registerSerial: 57, name: "Liberal Democratic Party", abbreviation: "LDP" },
  { registerSerial: 58, name: "Green Congress of Kenya", abbreviation: "GCK" },
  { registerSerial: 59, name: "National Liberal Party", abbreviation: "NLP" },
  { registerSerial: 60, name: "Movement for Democracy and Growth", abbreviation: "MDG" },
  { registerSerial: 61, name: "Alternative Leadership Party Of Kenya", abbreviation: "ALP-K" },
  { registerSerial: 62, name: "Ukweli Party", abbreviation: "UP" },
  { registerSerial: 63, name: "Empowerment and Liberation Party", abbreviation: "ELP" },
  { registerSerial: 64, name: "Third Way Alliance Kenya", abbreviation: "TAKE" },
  { registerSerial: 65, name: "Justice and Freedom Party of Kenya", abbreviation: "JFP" },
  { registerSerial: 66, name: "Grand Dream Development Party", abbreviation: "GDDP" },
  { registerSerial: 67, name: "United Green Movement", abbreviation: "UGM" },
  { registerSerial: 68, name: "Usawa Kwa Wote", abbreviation: "UKW" },
  { registerSerial: 69, name: "United Progressive Alliance", abbreviation: "UPA" },
  { registerSerial: 70, name: "The Service Party", abbreviation: "TSP" },
  { registerSerial: 71, name: "National Ordinary People Empowerment Union", abbreviation: "NOPEU" },
  { registerSerial: 72, name: "National Reconstruction Alliance", abbreviation: "NRA" },
  { registerSerial: 74, name: "Party for Peace and Development", abbreviation: "PPD" },
  { registerSerial: 75, name: "Chama Cha Kazi", abbreviation: "Kazi" },
  { registerSerial: 76, name: "Tujibebe Wakenya Party", abbreviation: "JIBEBE" },
  { registerSerial: 77, name: "Kenya Union Party", abbreviation: "KUP" },
  { registerSerial: 78, name: "Democratic National Alliance Party", abbreviation: "DNA" },
  { registerSerial: 79, name: "Pamoja African Alliance", abbreviation: "PAA" },
  { registerSerial: 80, name: "Mabadiliko Party of Kenya", abbreviation: "MAPK" },
  { registerSerial: 81, name: "Entrust Pioneer Party", abbreviation: "EPP" },
  { registerSerial: 82, name: "Party for Growth and Prosperity", abbreviation: "PGP" },
  { registerSerial: 83, name: "Green Thinking Action Party", abbreviation: "GTAP" },
  { registerSerial: 84, name: "National Democracy Expansion Party", abbreviation: "NDEP" },
  { registerSerial: 85, name: "Unified Change Party", abbreviation: "UCP" },
  { registerSerial: 86, name: "Universal Unity Party", abbreviation: "UUP" },
  { registerSerial: 87, name: "Chama ya Mapatano of Kenya", abbreviation: "CYMK" },
  { registerSerial: 88, name: "The Equitable Party", abbreviation: "TEP" },
  { registerSerial: 89, name: "Azimio la Umoja One Kenya Coalition Party", abbreviation: "Azimio" },
  { registerSerial: 90, name: "The We Alliance Party", abbreviation: "TWAP" },
  { registerSerial: 92, name: "National Economic Development Party", abbreviation: "NEDP" },
  { registerSerial: 93, name: "People's Renaissance Movement", abbreviation: "PM" },
  { registerSerial: 94, name: "Kenya United Generation Party", abbreviation: "KUG" },
  { registerSerial: 95, name: "Peoples' Forum for Rebuilding Democracy", abbreviation: "PFRD" },
  { registerSerial: 96, name: "Msingi wa Utaifa", abbreviation: "MUP" },
].map((party) => ({
  ...party,
  displayName: `${party.name} (${party.abbreviation})`,
}));

export const partyAffiliationOptions: PartyAffiliationOption[] = [
  {
    id: "independent-candidate",
    displayName: "Independent Candidate",
    affiliationType: "Independent",
  },
  ...politicalParties.map((party) => ({
    id: `party-${party.registerSerial}`,
    displayName: party.displayName,
    affiliationType: "Registered Party" as const,
    party,
  })),
];

export const kenyaGeographySummary = {
  counties: 47,
  constituencies: 290,
  extractedWardEntries: 2506,
  source: "List of Counties, constituencies and wards in Kenya.pdf, constituency schedule pages 127-163",
};

export const candidatePositionScopes: CandidatePositionScope[] = [
  {
    id: "president",
    displayName: "President",
    geographyLevel: "National",
    description: "National campaign across all counties.",
  },
  {
    id: "governor",
    displayName: "Governor",
    geographyLevel: "County",
    description: "County-level campaign.",
  },
  {
    id: "senator",
    displayName: "Senator",
    geographyLevel: "County",
    description: "County-level campaign.",
  },
  {
    id: "woman-representative",
    displayName: "Woman Representative",
    geographyLevel: "County",
    description: "County-level campaign.",
  },
  {
    id: "mp",
    displayName: "Member of National Assembly (MP)",
    geographyLevel: "Constituency",
    description: "Constituency-level campaign.",
  },
  {
    id: "mca",
    displayName: "Member of County Assembly (MCA)",
    geographyLevel: "Ward",
    description: "Ward-level campaign.",
  },
];

export const campaign = {
  tenantId: "demo-tenant",
  campaignName: "Demo Campaign",
  candidateName: "John Doe",
  positionTargeted: "MP",
  politicalParty: "Independent Candidate",
  county: "Configurable County",
  constituency: "Central Constituency",
  electionYear: 2027,
  slogan: "Service, dignity, delivery",
  primaryColor: "#0ea5e9",
  secondaryColor: "#0f172a",
};

export const roles: Role[] = [
  "Candidate",
  "Campaign Manager",
  "Constituency Coordinator",
  "Ward Coordinator",
  "Village Coordinator",
  "Volunteer",
  "Polling Agent",
  "Media Team",
  "Data Clerk",
  "Admin",
];

export const pollingStations: PollingStation[] = [
  { id: "ps-01", name: "Town Hall A", county: "Configurable County", constituency: "Central Constituency", ward: "Kijiji", village: "Market", registeredVoters: 1840 },
  { id: "ps-02", name: "Town Hall B", county: "Configurable County", constituency: "Central Constituency", ward: "Kijiji", village: "Market", registeredVoters: 1710 },
  { id: "ps-03", name: "Green Primary", county: "Configurable County", constituency: "Central Constituency", ward: "Mlimani", village: "Hilltop", registeredVoters: 1320 },
  { id: "ps-04", name: "River Road Center", county: "Configurable County", constituency: "Central Constituency", ward: "Mto", village: "Bridge", registeredVoters: 2260 },
  { id: "ps-05", name: "Community Grounds", county: "Configurable County", constituency: "Central Constituency", ward: "Umoja", village: "South", registeredVoters: 1960 },
  { id: "ps-06", name: "Faith Hall", county: "Configurable County", constituency: "Central Constituency", ward: "Umoja", village: "North", registeredVoters: 1420 },
];

const names = [
  ["Amina Wanjiru", "Female", "25-34", "Teacher", "Education"],
  ["Brian Otieno", "Male", "35-44", "Mechanic", "Jobs"],
  ["Catherine Achieng", "Female", "45-59", "Trader", "Healthcare"],
  ["David Mwangi", "Male", "18-24", "Student", "Youth Employment"],
  ["Esther Naliaka", "Female", "60+", "Farmer", "Water"],
  ["Felix Kiptoo", "Male", "25-34", "Boda Rider", "Roads"],
  ["Grace Moraa", "Female", "35-44", "Nurse", "Healthcare"],
  ["Hassan Ali", "Male", "45-59", "Shopkeeper", "Security"],
  ["Irene Nyambura", "Female", "25-34", "Data Clerk", "Cost of Living"],
  ["James Maina", "Male", "35-44", "Electrician", "Electricity"],
] as const;

export const supporters: Supporter[] = Array.from({ length: 72 }, (_, index) => {
  const person = names[index % names.length];
  const station = pollingStations[index % pollingStations.length];
  const levels: SupportLevel[] = ["Strong Supporter", "Leaning Supporter", "Undecided", "Opponent", "Unknown"];
  return {
    id: `sup-${String(index + 1).padStart(3, "0")}`,
    fullName: `${person[0]} ${index > 9 ? index : ""}`.trim(),
    phoneNumber: `+2547${String(10000000 + index * 731).slice(0, 8)}`,
    gender: person[1],
    ageGroup: person[2],
    occupation: person[3],
    county: station.county,
    constituency: station.constituency,
    ward: station.ward,
    village: station.village,
    pollingStation: station.name,
    supportLevel: levels[index % levels.length],
    keyIssue: person[4],
    volunteerInterest: index % 4 === 0 || index % 7 === 0,
    consentToContact: index % 8 !== 0,
    notes: index % 6 === 0 ? "Needs follow-up from ward coordinator." : "Captured during routine outreach.",
    registeredBy: index % 3 === 0 ? "Mary Field" : index % 3 === 1 ? "Peter Data" : "Rose Volunteer",
    createdAt: new Date(Date.UTC(2026, 5, 1 + (index % 14), 8 + (index % 8))).toISOString(),
  };
});

export const users: CampaignUser[] = [
  { id: "usr-01", name: "John Doe", email: "candidate@jukwaa.app", role: "Candidate", geography: "All campaign", status: "Active" },
  { id: "usr-02", name: "Mary Field", email: "manager@jukwaa.app", role: "Campaign Manager", geography: "All campaign", status: "Active" },
  { id: "usr-03", name: "Peter Data", email: "data@jukwaa.app", role: "Data Clerk", geography: "Central Constituency", status: "Active" },
  { id: "usr-04", name: "Rose Volunteer", email: "volunteer@jukwaa.app", role: "Volunteer", geography: "Kijiji Ward", status: "Invited" },
  { id: "usr-05", name: "Sam Polling", email: "polling@jukwaa.app", role: "Polling Agent", geography: "Town Hall A", status: "Suspended" },
];

export const auditTrail = [
  { user: "Mary Field", action: "Create", module: "Supporters", record: "Amina Wanjiru", timestamp: "2026-06-18 09:18", ipAddress: "196.201.12.44" },
  { user: "Peter Data", action: "Export", module: "Reports", record: "Supporters by Ward", timestamp: "2026-06-18 08:51", ipAddress: "196.201.12.88" },
  { user: "John Doe", action: "Login", module: "Auth", record: "Session", timestamp: "2026-06-18 08:10", ipAddress: "196.201.11.10" },
  { user: "Rose Volunteer", action: "Update", module: "Supporters", record: "Felix Kiptoo", timestamp: "2026-06-17 17:36", ipAddress: "196.201.14.17" },
];

export const volunteers: Volunteer[] = [
  { id: "vol-01", fullName: "Rose Volunteer", phoneNumber: "+254711200001", email: "rose@jukwaa.app", nationalId: "ID-1001", gender: "Female", age: 28, occupation: "Community Organizer", ward: "Kijiji", village: "Market", recruitmentSource: "Supporter referral", assignedSupervisor: "Mary Field", status: "Active", joinDate: "2026-05-20", notes: "Reliable door-to-door team lead." },
  { id: "vol-02", fullName: "Kevin Mutiso", phoneNumber: "+254711200002", email: "kevin@jukwaa.app", nationalId: "ID-1002", gender: "Male", age: 32, occupation: "Youth Coach", ward: "Mlimani", village: "Hilltop", recruitmentSource: "Town hall", assignedSupervisor: "Mary Field", status: "Active", joinDate: "2026-05-22", notes: "Strong youth mobilizer." },
  { id: "vol-03", fullName: "Lilian Akoth", phoneNumber: "+254711200003", email: "lilian@jukwaa.app", nationalId: "ID-1003", gender: "Female", age: 41, occupation: "Trader", ward: "Umoja", village: "South", recruitmentSource: "Market outreach", assignedSupervisor: "Peter Data", status: "Pending Approval", joinDate: "2026-06-04", notes: "Awaiting ID verification." },
  { id: "vol-04", fullName: "Moses Kariuki", phoneNumber: "+254711200004", email: "moses@jukwaa.app", nationalId: "ID-1004", gender: "Male", age: 37, occupation: "Driver", ward: "Mto", village: "Bridge", recruitmentSource: "Rally", assignedSupervisor: "Mary Field", status: "Active", joinDate: "2026-06-01", notes: "Available for event logistics." },
  { id: "vol-05", fullName: "Naomi Chebet", phoneNumber: "+254711200005", email: "naomi@jukwaa.app", nationalId: "ID-1005", gender: "Female", age: 25, occupation: "Student Leader", ward: "Umoja", village: "North", recruitmentSource: "Volunteer training", assignedSupervisor: "Rose Volunteer", status: "Inactive", joinDate: "2026-05-29", notes: "Exam period, check back next week." },
];

export const volunteerTasks: VolunteerTask[] = [
  { id: "task-01", title: "Door-to-door campaign", description: "Visit Market village households and capture undecided voter concerns.", assignedTo: "Rose Volunteer", dueDate: "2026-06-19", status: "In Progress", completionNotes: "42 households reached so far." },
  { id: "task-02", title: "Voter registration drive", description: "Identify unregistered youth near Green Primary.", assignedTo: "Kevin Mutiso", dueDate: "2026-06-20", status: "Pending", completionNotes: "" },
  { id: "task-03", title: "Rally mobilization", description: "Confirm attendance list for Community Grounds rally.", assignedTo: "Moses Kariuki", dueDate: "2026-06-18", status: "Completed", completionNotes: "Three transport routes confirmed." },
  { id: "task-04", title: "Follow-up visits", description: "Revisit undecided households logged last week.", assignedTo: "Lilian Akoth", dueDate: "2026-06-16", status: "Overdue", completionNotes: "Pending supervisor approval." },
  { id: "task-05", title: "Data collection", description: "Submit issue photos from North village.", assignedTo: "Naomi Chebet", dueDate: "2026-06-21", status: "Pending", completionNotes: "" },
];

export const fieldVisits: FieldVisit[] = [
  { id: "visit-01", volunteer: "Rose Volunteer", date: "2026-06-18", startTime: "08:15", endTime: "09:05", village: "Market", pollingStation: "Town Hall A", visitPurpose: "Door-to-door campaign", supportersEngaged: 31, notes: "Road repairs came up repeatedly.", latitude: -1.2864, longitude: 36.8172, photos: 2 },
  { id: "visit-02", volunteer: "Kevin Mutiso", date: "2026-06-18", startTime: "10:00", endTime: "10:45", village: "Hilltop", pollingStation: "Green Primary", visitPurpose: "Voter registration drive", supportersEngaged: 24, notes: "Youth employment and sports funding concerns.", latitude: -1.2921, longitude: 36.8219, photos: 1 },
  { id: "visit-03", volunteer: "Moses Kariuki", date: "2026-06-17", startTime: "15:20", endTime: "16:10", village: "Bridge", pollingStation: "River Road Center", visitPurpose: "Rally mobilization", supportersEngaged: 18, notes: "Transport route agreed with village chair.", latitude: -1.2767, longitude: 36.8076, photos: 3 },
  { id: "visit-04", volunteer: "Lilian Akoth", date: "2026-06-17", startTime: "12:10", endTime: "12:55", village: "South", pollingStation: "Community Grounds", visitPurpose: "Community meeting", supportersEngaged: 22, notes: "Clinic staffing issue logged.", latitude: -1.3012, longitude: 36.8293, photos: 2 },
];

export const intelligenceReports: IntelligenceReport[] = [
  { id: "intel-01", title: "Opponent team booking youth hall", category: "Opponent Activity", location: "Kijiji Ward", description: "Rival mobilizers booked youth hall for Saturday.", urgency: "Medium", submittedBy: "Rose Volunteer", photos: 1, createdAt: "2026-06-18 10:20" },
  { id: "intel-02", title: "Positive mood after water pledge", category: "Community Mood", location: "Umoja South", description: "Residents responded well to water project update.", urgency: "Low", submittedBy: "Lilian Akoth", photos: 0, createdAt: "2026-06-18 11:05" },
  { id: "intel-03", title: "Security tension near bridge", category: "Security Concern", location: "Mto Bridge", description: "Local leaders requested calmer messaging before rally.", urgency: "High", submittedBy: "Moses Kariuki", photos: 2, createdAt: "2026-06-17 16:35" },
  { id: "intel-04", title: "Influencer open to endorsement", category: "Local Influencers", location: "Mlimani Ward", description: "Popular youth coach asked for policy brief.", urgency: "Medium", submittedBy: "Kevin Mutiso", photos: 0, createdAt: "2026-06-17 14:12" },
];

export const communityIssues: CommunityIssue[] = [
  { id: "issue-01", title: "Market road drainage", category: "Roads", description: "Stalls flood after heavy rain.", ward: "Kijiji", village: "Market", pollingStation: "Town Hall A", mentions: 38, priority: "High", status: "Open" },
  { id: "issue-02", title: "Clinic night shift staffing", category: "Healthcare", description: "Residents report limited night coverage.", ward: "Umoja", village: "South", pollingStation: "Community Grounds", mentions: 24, priority: "Critical", status: "Under Review" },
  { id: "issue-03", title: "Youth job placement", category: "Youth Employment", description: "Requests for apprenticeship links.", ward: "Mlimani", village: "Hilltop", pollingStation: "Green Primary", mentions: 31, priority: "High", status: "Open" },
  { id: "issue-04", title: "Street lighting gaps", category: "Electricity", description: "Dark sections near bridge.", ward: "Mto", village: "Bridge", pollingStation: "River Road Center", mentions: 19, priority: "Medium", status: "Addressed" },
  { id: "issue-05", title: "Water kiosk downtime", category: "Water", description: "Intermittent kiosk service in North village.", ward: "Umoja", village: "North", pollingStation: "Faith Hall", mentions: 27, priority: "High", status: "Open" },
];

export const campaignEvents: CampaignEvent[] = [
  { id: "event-01", title: "Community Grounds Rally", type: "Rally", venue: "Community Grounds", date: "2026-06-22", startTime: "14:00", endTime: "17:00", expectedAttendance: 1200, organizer: "Mary Field", description: "Ward-wide mobilization rally.", actualAttendance: 0, newSupporters: 0 },
  { id: "event-02", title: "Kijiji Town Hall", type: "Town Hall", venue: "Town Hall A", date: "2026-06-19", startTime: "18:00", endTime: "20:00", expectedAttendance: 220, organizer: "Rose Volunteer", description: "Issue listening session.", actualAttendance: 184, newSupporters: 27 },
  { id: "event-03", title: "Volunteer Training", type: "Volunteer Training", venue: "Campaign Office", date: "2026-06-16", startTime: "09:00", endTime: "12:00", expectedAttendance: 80, organizer: "Peter Data", description: "Data capture and field safety training.", actualAttendance: 73, newSupporters: 9 },
  { id: "event-04", title: "Press Briefing", type: "Press Conference", venue: "Media Center", date: "2026-06-20", startTime: "10:30", endTime: "11:15", expectedAttendance: 60, organizer: "John Doe", description: "Policy update and Q&A.", actualAttendance: 0, newSupporters: 0 },
];

export const notifications = [
  { title: "New task assigned", detail: "Kevin Mutiso has a voter registration task due on 2026-06-20.", tone: "info" },
  { title: "Task overdue", detail: "Follow-up visits assigned to Lilian Akoth are overdue.", tone: "danger" },
  { title: "Event reminder", detail: "Kijiji Town Hall starts at 18:00.", tone: "warning" },
  { title: "Intelligence submitted", detail: "Security concern reported in Mto Bridge.", tone: "danger" },
];

export const pollingAgents: PollingAgent[] = [
  { id: "agent-01", fullName: "Sam Polling", phoneNumber: "+254722300001", nationalId: "ID-2001", pollingStation: "Town Hall A", ward: "Kijiji", manager: "Mary Field", status: "Active", lastSeen: "2027-08-09 15:05", latitude: -1.2864, longitude: 36.8172 },
  { id: "agent-02", fullName: "Mercy Adhiambo", phoneNumber: "+254722300002", nationalId: "ID-2002", pollingStation: "Town Hall B", ward: "Kijiji", manager: "Mary Field", status: "Checked In", lastSeen: "2027-08-09 14:50", latitude: -1.2867, longitude: 36.8175 },
  { id: "agent-03", fullName: "Daniel Kipruto", phoneNumber: "+254722300003", nationalId: "ID-2003", pollingStation: "Green Primary", ward: "Mlimani", manager: "Peter Data", status: "Active", lastSeen: "2027-08-09 15:11", latitude: -1.2921, longitude: 36.8219 },
  { id: "agent-04", fullName: "Njeri Kamau", phoneNumber: "+254722300004", nationalId: "ID-2004", pollingStation: "River Road Center", ward: "Mto", manager: "Mary Field", status: "Offline", lastSeen: "2027-08-09 12:30", latitude: -1.2767, longitude: 36.8076 },
  { id: "agent-05", fullName: "Victor Ouma", phoneNumber: "+254722300005", nationalId: "ID-2005", pollingStation: "Community Grounds", ward: "Umoja", manager: "Peter Data", status: "Completed", lastSeen: "2027-08-09 17:12", latitude: -1.3012, longitude: 36.8293 },
  { id: "agent-06", fullName: "Faith Chebet", phoneNumber: "+254722300006", nationalId: "ID-2006", pollingStation: "Faith Hall", ward: "Umoja", manager: "Mary Field", status: "Confirmed", lastSeen: "2027-08-09 08:02", latitude: -1.2984, longitude: 36.8261 },
];

export const turnoutUpdates: TurnoutUpdate[] = [
  ["07:00", 58, 61], ["09:00", 168, 174], ["11:00", 304, 326], ["13:00", 448, 463], ["15:00", 590, 612], ["17:00", 702, 719],
].flatMap(([interval, maleBase, femaleBase], intervalIndex) =>
  pollingStations.map((station, stationIndex) => {
    const maleVoters = Number(maleBase) + stationIndex * 19;
    const femaleVoters = Number(femaleBase) + stationIndex * 21;
    const totalTurnout = maleVoters + femaleVoters;
    return {
      id: `turnout-${intervalIndex + 1}-${station.id}`,
      pollingStation: station.name,
      interval: String(interval),
      maleVoters,
      femaleVoters,
      totalTurnout,
      turnoutPercentage: Math.min(100, Math.round((totalTurnout / station.registeredVoters) * 1000) / 10),
      submittedBy: pollingAgents[stationIndex % pollingAgents.length].fullName,
    };
  })
);

export const electionIncidents: ElectionIncident[] = [
  { id: "inc-01", title: "Agent denied desk access", category: "Agent Access Issues", description: "Presiding officer requested intervention before allowing party desk setup.", pollingStation: "Town Hall B", urgency: "High", status: "Resolved", submittedBy: "Mercy Adhiambo", assignedTo: "Mary Field", photos: 2, videos: 0, latitude: -1.2867, longitude: 36.8175, createdAt: "2027-08-09 07:42" },
  { id: "inc-02", title: "Missing KIEMS backup battery", category: "Technology Failure", description: "Queue slowed after device power issue. Agent requested technical follow-up.", pollingStation: "River Road Center", urgency: "Critical", status: "In Progress", submittedBy: "Njeri Kamau", assignedTo: "Peter Data", photos: 1, videos: 1, latitude: -1.2767, longitude: 36.8076, createdAt: "2027-08-09 11:20" },
  { id: "inc-03", title: "Low turnout pocket", category: "Voter Suppression", description: "Elderly voters reported transport intimidation on bridge route.", pollingStation: "Faith Hall", urgency: "Medium", status: "Open", submittedBy: "Faith Chebet", assignedTo: "Mary Field", photos: 0, videos: 0, latitude: -1.2984, longitude: 36.8261, createdAt: "2027-08-09 14:15" },
];

export const electionForms: ElectionForm[] = [
  { id: "form-01", formType: "Form 35", pollingStation: "Town Hall A", uploadedBy: "Sam Polling", uploadedAt: "2027-08-09 17:31", qualityStatus: "Verified", duplicateCheck: "Clear", missingFields: [], suspicious: false },
  { id: "form-02", formType: "Form 35", pollingStation: "Town Hall B", uploadedBy: "Mercy Adhiambo", uploadedAt: "2027-08-09 17:44", qualityStatus: "Pending", duplicateCheck: "Clear", missingFields: ["Deputy presiding officer signature"], suspicious: false },
  { id: "form-03", formType: "Form 35", pollingStation: "Green Primary", uploadedBy: "Daniel Kipruto", uploadedAt: "2027-08-09 17:52", qualityStatus: "Verified", duplicateCheck: "Clear", missingFields: [], suspicious: false },
  { id: "form-04", formType: "Form 35", pollingStation: "River Road Center", uploadedBy: "Njeri Kamau", uploadedAt: "2027-08-09 18:02", qualityStatus: "Rejected", duplicateCheck: "Possible Duplicate", missingFields: ["Stamped page"], suspicious: true },
  { id: "form-05", formType: "Form 35", pollingStation: "Community Grounds", uploadedBy: "Victor Ouma", uploadedAt: "2027-08-09 17:58", qualityStatus: "Verified", duplicateCheck: "Clear", missingFields: [], suspicious: false },
];

export const pollingResults: PollingResult[] = [
  { id: "res-01", pollingStation: "Town Hall A", candidate: "John Doe", votes: 768, rejectedVotes: 18, totalVotes: 1421, verificationStatus: "Verified", uploadedBy: "Sam Polling" },
  { id: "res-02", pollingStation: "Town Hall A", candidate: "Main Opponent", votes: 615, rejectedVotes: 18, totalVotes: 1421, verificationStatus: "Verified", uploadedBy: "Sam Polling" },
  { id: "res-03", pollingStation: "Town Hall B", candidate: "John Doe", votes: 704, rejectedVotes: 16, totalVotes: 1338, verificationStatus: "Pending", uploadedBy: "Mercy Adhiambo" },
  { id: "res-04", pollingStation: "Town Hall B", candidate: "Main Opponent", votes: 618, rejectedVotes: 16, totalVotes: 1338, verificationStatus: "Pending", uploadedBy: "Mercy Adhiambo" },
  { id: "res-05", pollingStation: "Green Primary", candidate: "John Doe", votes: 611, rejectedVotes: 12, totalVotes: 1117, verificationStatus: "Verified", uploadedBy: "Daniel Kipruto" },
  { id: "res-06", pollingStation: "Green Primary", candidate: "Main Opponent", votes: 494, rejectedVotes: 12, totalVotes: 1117, verificationStatus: "Verified", uploadedBy: "Daniel Kipruto" },
  { id: "res-07", pollingStation: "Community Grounds", candidate: "John Doe", votes: 854, rejectedVotes: 22, totalVotes: 1608, verificationStatus: "Verified", uploadedBy: "Victor Ouma" },
  { id: "res-08", pollingStation: "Community Grounds", candidate: "Main Opponent", votes: 732, rejectedVotes: 22, totalVotes: 1608, verificationStatus: "Verified", uploadedBy: "Victor Ouma" },
];

export const electionAlerts: ElectionAlert[] = [
  { id: "alert-01", title: "Agent offline", body: "River Road Center agent has not synced since 12:30.", alertType: "Agent", severity: "Critical", pollingStation: "River Road Center", status: "Unread", createdAt: "2027-08-09 15:00" },
  { id: "alert-02", title: "Low turnout", body: "Faith Hall turnout trails supporter base and ward average.", alertType: "Turnout", severity: "Medium", pollingStation: "Faith Hall", status: "Unread", createdAt: "2027-08-09 15:15" },
  { id: "alert-03", title: "Form needs review", body: "River Road Center form has duplicate and missing stamp flags.", alertType: "Results", severity: "High", pollingStation: "River Road Center", status: "Read", createdAt: "2027-08-09 18:05" },
];

export const candidateProfiles: CandidateProfile[] = [
  {
    id: "cand-001",
    tenantId: campaign.tenantId,
    fullName: "John Doe",
    phoneNumber: "+254700111222",
    email: "candidate@jukwaa.app",
    nationalId: "ID-0001",
    gender: "Male",
    dateOfBirth: "1984-04-12",
    profilePhoto: "/candidate/john-doe.jpg",
    politicalParty: campaign.politicalParty,
    positionContesting: "Member of National Assembly (MP)",
    county: campaign.county,
    constituency: campaign.constituency,
    ward: "All wards",
    campaignName: "John Doe for MP",
    slogan: campaign.slogan,
    biography: "Community advocate focused on service delivery, youth jobs, and accountable local leadership.",
    campaignStartDate: "2026-01-15",
    campaignEndDate: "2027-08-30",
    activeStatus: "Active",
    verificationStatus: "Verified",
    createdAt: "2026-01-15 09:00",
    updatedAt: "2026-06-18 12:00",
  },
];

export const workspaceOwnership: WorkspaceOwnership = {
  workspace: "John Doe for MP",
  candidate: "John Doe",
  campaignManager: "Mary Field",
  ownershipStatus: "Compliant",
  candidateLocked: true,
  managerReplacePolicy: "Only Candidate or JUKWAA Super Admin can replace the Campaign Manager.",
};

export const invitations: Invitation[] = [
  { id: "inv-001", candidateId: "cand-001", invitedName: "Mary Field", invitedPhone: "+254711000101", invitedEmail: "manager@jukwaa.app", role: "Campaign Manager", invitedBy: "John Doe", invitationCode: "JUK-MARY-2027", status: "Accepted", expiryDate: "2026-02-01", createdAt: "2026-01-16" },
  { id: "inv-002", candidateId: "cand-001", invitedName: "Peter Data", invitedPhone: "+254711000102", invitedEmail: "data@jukwaa.app", role: "Data Clerk", invitedBy: "Mary Field", invitationCode: "JUK-DATA-2027", status: "Accepted", expiryDate: "2026-02-05", createdAt: "2026-01-20" },
  { id: "inv-003", candidateId: "cand-001", invitedName: "Grace Ward", invitedPhone: "+254711000103", invitedEmail: "grace@jukwaa.app", role: "Ward Coordinator", invitedBy: "Mary Field", invitationCode: "JUK-WARD-4821", status: "Pending", expiryDate: "2026-06-25", createdAt: "2026-06-18" },
  { id: "inv-004", candidateId: "cand-001", invitedName: "Sam Polling", invitedPhone: "+254722300001", invitedEmail: "polling@jukwaa.app", role: "Polling Agent", invitedBy: "Peter Data", invitationCode: "JUK-POLL-9102", status: "Accepted", expiryDate: "2026-06-10", createdAt: "2026-06-02" },
  { id: "inv-005", candidateId: "cand-001", invitedName: "Old Volunteer", invitedPhone: "+254711000104", invitedEmail: "old@jukwaa.app", role: "Volunteer", invitedBy: "Mary Field", invitationCode: "JUK-VOID-1150", status: "Revoked", expiryDate: "2026-05-30", createdAt: "2026-05-22" },
];

export const electionCycles: ElectionCycle[] = [
  { id: "elec-2027-mp", electionName: "Kenya General Election 2027", country: "Kenya", electionType: "MP", electionDate: "2027-08-09", status: "Active" },
  { id: "elec-2032-mp", electionName: "Kenya General Election 2032", country: "Kenya", electionType: "MP", electionDate: "2032-08-10", status: "Draft" },
  { id: "elec-party-2026", electionName: "Party Nomination 2026", country: "Kenya", electionType: "Party Election", electionDate: "2026-11-20", status: "Draft" },
];

export const candidateBranding: CandidateBranding = {
  logo: "JD",
  campaignColors: [campaign.primaryColor, campaign.secondaryColor, "#475569"],
  candidatePhoto: "/candidate/john-doe.jpg",
  slogan: campaign.slogan,
  campaignBanner: "/campaign/banner-john-doe.jpg",
  socialLinks: {
    x: "https://x.com/johndoe",
    facebook: "https://facebook.com/johndoecampaign",
    whatsapp: "https://wa.me/254700111222",
  },
};

export const teamHierarchy: TeamHierarchyNode[] = [
  { level: "01", role: "Candidate", name: "John Doe", status: "Approved", members: 1 },
  { level: "02", role: "Campaign Manager", name: "Mary Field", parent: "John Doe", status: "Approved", members: 1 },
  { level: "03", role: "Constituency Coordinator", name: "Central Constituency Desk", parent: "Mary Field", status: "Approved", members: 2 },
  { level: "04", role: "Ward Coordinator", name: "Ward Command Team", parent: "Central Constituency Desk", status: "Pending Approval", members: 4 },
  { level: "05", role: "Village Coordinator", name: "Village Captains", parent: "Ward Command Team", status: "Approved", members: 12 },
  { level: "06", role: "Volunteer", name: "Volunteer Network", parent: "Village Captains", status: "Approved", members: volunteers.length },
  { level: "07", role: "Polling Agent", name: "Polling Agent Corps", parent: "Volunteer Network", status: "Approved", members: pollingAgents.length },
];

export const workspaceSubscription: WorkspaceSubscription = {
  id: "sub-001",
  plan: "Professional",
  startDate: "2026-01-15",
  expiryDate: "2027-09-15",
  status: "Active",
  userLimit: 50,
  volunteerLimit: 500,
  pollingAgentLimit: 300,
  storageGb: 100,
};

export const featureEntitlements: FeatureEntitlements = {
  aiAccess: false,
  smsAccess: true,
  whatsappAccess: true,
  pollingAgentLimit: workspaceSubscription.pollingAgentLimit,
  storageLimitGb: workspaceSubscription.storageGb,
  userLimit: workspaceSubscription.userLimit,
};

export const invoices: Invoice[] = [
  { id: "invn-001", invoiceNumber: "JUK-2026-0001", plan: "Professional", amountKes: 45000, status: "Paid", dueDate: "2026-02-01" },
  { id: "invn-002", invoiceNumber: "JUK-2027-0007", plan: "Professional", amountKes: 45000, status: "Issued", dueDate: "2027-01-15" },
];

export const payments: PaymentRecord[] = [
  { id: "pay-001", method: "M-Pesa STK Push", amountKes: 45000, status: "Confirmed", reference: "QBJ7X9KD2", createdAt: "2026-01-15 10:40" },
  { id: "pay-002", method: "Bank Transfer", amountKes: 45000, status: "Pending", reference: "BANK-2027-0007", createdAt: "2027-01-08 14:15" },
];

export const securityEvents: SecurityEvent[] = [
  { id: "sec-001", user: "Mary Field", event: "Login", device: "Chrome on Android", ipAddress: "196.201.12.44", createdAt: "2026-06-18 09:12" },
  { id: "sec-002", user: "Peter Data", event: "Failed Login", device: "Windows Desktop", ipAddress: "196.201.12.88", createdAt: "2026-06-18 08:44" },
  { id: "sec-003", user: "John Doe", event: "Device Added", device: "Safari on iPhone", ipAddress: "196.201.11.10", createdAt: "2026-06-17 19:05" },
  { id: "sec-004", user: "Rose Volunteer", event: "Session Revoked", device: "Android App", ipAddress: "196.201.14.17", createdAt: "2026-06-16 17:22" },
];

export const aiRecommendations: AiRecommendation[] = [
  { id: "ai-001", title: "Increase volunteer activity in Mto", description: "River Road Center has low coverage and an unresolved election-day incident.", impactScore: 92, category: "Action", source: "Coverage + incident trends" },
  { id: "ai-002", title: "Run a youth jobs meeting near Green Primary", description: "Youth employment is a top concern and the station has persuadable voters.", impactScore: 86, category: "Opportunity", source: "Supporter issues + polling station data" },
  { id: "ai-003", title: "Target undecided voters before next rally", description: "Undecided voters are concentrated in stations with upcoming event activity.", impactScore: 78, category: "Action", source: "Supporter CRM + events" },
  { id: "ai-004", title: "Audit River Road form workflow", description: "Rejected form and offline agent activity increase results risk.", impactScore: 74, category: "Risk", source: "PVT quality queue" },
];

export const aiContentAssets: AiContentAsset[] = [
  { id: "content-001", type: "Rally Speech", title: "Service delivery rally speech", audience: "Ward rally", status: "Draft" },
  { id: "content-002", type: "Social Caption", title: "Youth jobs carousel caption", audience: "18-34 voters", status: "Approved" },
  { id: "content-003", type: "Volunteer Message", title: "Door-to-door reminder", audience: "Volunteer network", status: "Published" },
];

export const donations: Donation[] = [
  { id: "don-001", donorName: "Amina Wanjiru", donorType: "Individual", phone: "+254710000000", email: "amina@example.com", amountKes: 2500, date: "2026-06-15", paymentMethod: "Paybill", notes: "Monthly supporter contribution." },
  { id: "don-002", donorName: "Central Traders Sacco", donorType: "Corporate", phone: "+254720222333", email: "treasurer@traders.example", amountKes: 50000, date: "2026-06-16", paymentMethod: "M-Pesa STK Push", notes: "Fundraising breakfast pledge." },
  { id: "don-003", donorName: "Kijiji Town Hall Guests", donorType: "Event Contribution", phone: "+254733444555", email: "events@jukwaa.app", amountKes: 18700, date: "2026-06-19", paymentMethod: "Paybill", notes: "Event collection." },
];

export const expenses: Expense[] = [
  { id: "exp-001", vendor: "Bridge Fuel Station", category: "Fuel", amountKes: 8400, date: "2026-06-17", status: "Paid", receiptUrl: "/receipts/fuel-001.pdf", approvedBy: "Mary Field" },
  { id: "exp-002", vendor: "Mlimani Printers", category: "Printing", amountKes: 32000, date: "2026-06-18", status: "Approved", receiptUrl: "/receipts/printing-002.pdf", approvedBy: "John Doe" },
  { id: "exp-003", vendor: "Community Grounds PA", category: "Events", amountKes: 45000, date: "2026-06-22", status: "Pending Approval", receiptUrl: "/receipts/events-003.pdf", approvedBy: "Mary Field" },
];

export const budgets: BudgetLine[] = [
  { id: "bud-001", category: "Fuel", budgetedKes: 120000, actualKes: 38400 },
  { id: "bud-002", category: "Events", budgetedKes: 450000, actualKes: 184000 },
  { id: "bud-003", category: "Printing", budgetedKes: 180000, actualKes: 92000 },
  { id: "bud-004", category: "Marketing", budgetedKes: 250000, actualKes: 76000 },
];

export const fundraisingCampaigns: FundraisingCampaign[] = [
  { id: "fund-001", title: "Ward Mobilization Fund", goalAmountKes: 300000, raisedKes: 158700, targetDate: "2026-07-15", description: "Transport, volunteer meals, and rally logistics.", status: "Active" },
  { id: "fund-002", title: "Polling Agent Training", goalAmountKes: 180000, raisedKes: 72000, targetDate: "2026-08-01", description: "Training material, venue, and agent support.", status: "Active" },
];

export const mpesaPaymentSetting: MpesaPaymentSetting = {
  paybillNumber: "CONFIGURE_PAYBILL",
  accountReferenceFormat: "JUKWAA-{workspace}-{invoice}",
  callbackUrl: "https://jukwaakenya.co.ke/api/payments/mpesa/callback",
  stkPushReady: true,
  paybillReady: true,
  tillReady: false,
};

export const mpesaTransactions: MpesaTransactionLog[] = [
  { id: "mpesa-001", purpose: "Subscription", phone: "+254700111222", amountKes: 45000, method: "Paybill", accountReference: "JUKWAA-JOHNDOE-JUK-2026-0001", checkoutRequestId: "manual-paybill-QBJ7X9KD2", status: "Confirmed", createdAt: "2026-01-15 10:40" },
  { id: "mpesa-002", purpose: "Donation", phone: "+254720222333", amountKes: 50000, method: "STK Push", accountReference: "JUKWAA-JOHNDOE-DON-002", checkoutRequestId: "ws_CO_160620261004", status: "Confirmed", createdAt: "2026-06-16 10:04" },
  { id: "mpesa-003", purpose: "Fundraising", phone: "+254733444555", amountKes: 18700, method: "Paybill", accountReference: "JUKWAA-JOHNDOE-FUND-001", checkoutRequestId: "manual-paybill-FUND001", status: "Pending", createdAt: "2026-06-19 19:44" },
];

export const predictiveInsights: PredictiveInsight[] = [
  { id: "pred-001", metric: "Competitiveness", estimate: 64, label: "Leaning competitive", caveat: "Strategic estimate based on available campaign data." },
  { id: "pred-002", metric: "Volunteer growth", estimate: 72, label: "Healthy growth", caveat: "Projection assumes current recruitment pace continues." },
  { id: "pred-003", metric: "Mobilization gap", estimate: 38, label: "Needs attention", caveat: "Lower score means wider gap in weaker polling stations." },
];

export const scenarioPlans: ScenarioPlan[] = [
  { id: "scenario-001", title: "Higher turnout push", turnoutShift: 8, volunteerIncrease: 12, additionalSpendKes: 85000, projectedImpact: "Improves turnout estimate in Umoja and Kijiji wards." },
  { id: "scenario-002", title: "Volunteer surge", turnoutShift: 3, volunteerIncrease: 25, additionalSpendKes: 45000, projectedImpact: "Improves coverage and undecided voter follow-up." },
  { id: "scenario-003", title: "Low spend hold", turnoutShift: -2, volunteerIncrease: 5, additionalSpendKes: 15000, projectedImpact: "Maintains current base but leaves Mto risk unresolved." },
];

export const campaignDocuments: CampaignDocument[] = [
  { id: "doc-001", title: "Volunteer Training Manual", category: "Training Material", version: "v1.2", permission: "All Team", updatedAt: "2026-06-18" },
  { id: "doc-002", title: "Campaign Budget Master", category: "Budget", version: "v2.0", permission: "Managers", updatedAt: "2026-06-17" },
  { id: "doc-003", title: "Polling Agent SOP", category: "Result Form", version: "v1.1", permission: "All Team", updatedAt: "2026-06-16" },
];

export const knowledgeArticles: KnowledgeArticle[] = [
  { id: "know-001", title: "How to register supporters offline", category: "SOP", audience: "Volunteers", updatedAt: "2026-06-18" },
  { id: "know-002", title: "Election day incident escalation", category: "Campaign Manual", audience: "Polling Agents", updatedAt: "2026-06-17" },
  { id: "know-003", title: "Finance approval policy", category: "FAQ", audience: "Managers", updatedAt: "2026-06-15" },
];

export const solcoIntegration: SolcoIntegrationStatus = {
  workspaceUrl: "https://www.solco.co.ke",
  livekitUrl: "Reused from Solco LiveKit environment",
  status: "Needs Env",
  tokenEndpoint: "/api/communications/livekit-token",
  meetingPath: "/meeting/{roomName}",
};

export const communicationRooms: CommunicationRoom[] = [
  { id: "room-001", title: "Daily Campaign Command Briefing", livekitRoomName: "jukwaa-command-briefing", purpose: "Command Briefing", status: "Live", audience: "Candidate, campaign manager, coordinators", scheduledAt: "2026-06-18 18:00", host: "John Doe", participants: 18 },
  { id: "room-002", title: "Umoja Ward Volunteer Coordination", livekitRoomName: "jukwaa-umoja-volunteers", purpose: "Volunteer Coordination", status: "Scheduled", audience: "Ward coordinators and volunteers", scheduledAt: "2026-06-19 07:30", host: "Mary Field", participants: 42 },
  { id: "room-003", title: "Kijiji Youth Town Hall", livekitRoomName: "jukwaa-kijiji-townhall", purpose: "Ward Town Hall", status: "Scheduled", audience: "Youth leaders and community mobilizers", scheduledAt: "2026-06-20 16:00", host: "James Data", participants: 120 },
];

export const communicationMessages: CommunicationMessage[] = [
  { id: "comm-001", channel: "Solco Meeting", subject: "Command briefing link shared", sender: "Campaign Manager", audience: "Core team", status: "Delivered", sentAt: "2026-06-18 17:42" },
  { id: "comm-002", channel: "Broadcast SMS", subject: "Volunteer reporting reminder", sender: "Field Director", audience: "Active volunteers", status: "Sent", sentAt: "2026-06-18 08:15" },
  { id: "comm-003", channel: "WhatsApp", subject: "Town hall mobilization kit", sender: "Media Team", audience: "Ward coordinators", status: "Queued", sentAt: "2026-06-18 20:00" },
];

export function summarizeCampaign() {
  const strong = supporters.filter((supporter) => supporter.supportLevel === "Strong Supporter").length;
  const undecided = supporters.filter((supporter) => supporter.supportLevel === "Undecided").length;
  const volunteers = supporters.filter((supporter) => supporter.volunteerInterest).length;
  const coveredStations = new Set(supporters.map((supporter) => supporter.pollingStation)).size;
  const coveredWards = new Set(supporters.map((supporter) => supporter.ward)).size;

  return {
    totalSupporters: supporters.length,
    strong,
    undecided,
    volunteers,
    coveredStations,
    coveredWards,
  };
}

export function summarizePhaseTwo() {
  const activeVolunteers = volunteers.filter((volunteer) => volunteer.status === "Active").length;
  const tasksCompleted = volunteerTasks.filter((task) => task.status === "Completed").length;
  const openIssues = communityIssues.filter((issue) => issue.status !== "Addressed").length;
  const upcomingEvents = campaignEvents.filter((event) => new Date(`${event.date}T00:00:00Z`) >= new Date("2026-06-18T00:00:00Z")).length;
  const coverage = territoryCoverage();
  const coveragePercent = Math.round(coverage.reduce((sum, row) => sum + row.score, 0) / coverage.length);

  return {
    activeVolunteers,
    tasksCompleted,
    coveragePercent,
    openIssues,
    upcomingEvents,
    intelligenceReports: intelligenceReports.length,
  };
}

export function groupCount<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const value = String(item[key]);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return Array.from(counts, ([name, value]) => ({ name, value }));
}

export function pollingAnalytics() {
  return pollingStations.map((station) => {
    const stationSupporters = supporters.filter((supporter) => supporter.pollingStation === station.name);
    const strong = stationSupporters.filter((supporter) => supporter.supportLevel === "Strong Supporter").length;
    const undecided = stationSupporters.filter((supporter) => supporter.supportLevel === "Undecided").length;
    const penetration = Math.round((stationSupporters.length / station.registeredVoters) * 1000) / 10;
    return {
      ...station,
      identifiedSupporters: stationSupporters.length,
      strong,
      undecided,
      penetration,
    };
  });
}

export function volunteerPerformance() {
  return volunteers.map((volunteer) => {
    const supportersRegistered = supporters.filter((supporter) => supporter.registeredBy === volunteer.fullName).length;
    const activitiesCompleted = fieldVisits.filter((visit) => visit.volunteer === volunteer.fullName).length + volunteerTasks.filter((task) => task.assignedTo === volunteer.fullName && task.status === "Completed").length;
    const issuesSubmitted = communityIssues.filter((issue) => issue.village === volunteer.village || issue.ward === volunteer.ward).length;
    const eventsAttended = campaignEvents.filter((event) => event.organizer === volunteer.fullName || event.actualAttendance > 0).length;
    const lastActivity = fieldVisits.find((visit) => visit.volunteer === volunteer.fullName)?.date ?? volunteer.joinDate;
    const score = supportersRegistered * 4 + activitiesCompleted * 18 + issuesSubmitted * 8 + eventsAttended * 5;

    return {
      name: volunteer.fullName,
      area: `${volunteer.ward} / ${volunteer.village}`,
      supportersRegistered,
      activitiesCompleted,
      issuesSubmitted,
      eventsAttended,
      lastActivity,
      score,
    };
  }).sort((a, b) => b.score - a.score);
}

export function territoryCoverage() {
  return pollingStations.map((station) => {
    const stationSupporters = supporters.filter((supporter) => supporter.pollingStation === station.name).length;
    const visitActivity = fieldVisits.filter((visit) => visit.pollingStation === station.name).length;
    const events = campaignEvents.filter((event) => event.venue === station.name || event.venue === "Community Grounds").length;
    const issues = communityIssues.filter((issue) => issue.pollingStation === station.name).length;
    const score = Math.min(100, Math.round(stationSupporters * 1.8 + visitActivity * 18 + events * 8 + issues * 10));
    const status = score >= 70 ? "Well covered" : score >= 40 ? "Moderately covered" : "Poorly covered";
    return {
      name: station.name,
      ward: station.ward,
      village: station.village,
      supporters: stationSupporters,
      activity: visitActivity,
      events,
      issues,
      score,
      status,
    };
  });
}

export function eventAttendanceTrend() {
  return campaignEvents.map((event) => ({
    name: event.title.split(" ")[0],
    expected: event.expectedAttendance,
    actual: event.actualAttendance,
  }));
}

export function summarizeElectionOps() {
  const latestTurnoutByStation = new Map<string, TurnoutUpdate>();
  turnoutUpdates.forEach((update) => latestTurnoutByStation.set(update.pollingStation, update));
  const latestTurnout = Array.from(latestTurnoutByStation.values());
  const reportedStations = new Set(latestTurnout.map((update) => update.pollingStation)).size;
  const totalRegistered = pollingStations.reduce((sum, station) => sum + station.registeredVoters, 0);
  const totalTurnout = latestTurnout.reduce((sum, update) => sum + update.totalTurnout, 0);
  const activeAgents = pollingAgents.filter((agent) => ["Checked In", "Active", "Completed"].includes(agent.status)).length;
  const verifiedForms = electionForms.filter((form) => form.qualityStatus === "Verified").length;
  const resultsStations = new Set(pollingResults.map((result) => result.pollingStation)).size;

  return {
    stationCoverage: Math.round((reportedStations / pollingStations.length) * 100),
    agentCoverage: Math.round((activeAgents / pollingAgents.length) * 100),
    turnoutPercentage: Math.round((totalTurnout / totalRegistered) * 1000) / 10,
    totalTurnout,
    openIncidents: electionIncidents.filter((incident) => incident.status !== "Resolved").length,
    verifiedForms,
    formCoverage: Math.round((verifiedForms / pollingStations.length) * 100),
    resultsStations,
    resultsCoverage: Math.round((resultsStations / pollingStations.length) * 100),
    criticalAlerts: electionAlerts.filter((alert) => alert.severity === "Critical").length,
  };
}

export function agentDeploymentRows() {
  return pollingStations.map((station) => {
    const agent = pollingAgents.find((item) => item.pollingStation === station.name);
    const latestTurnout = turnoutUpdates.filter((update) => update.pollingStation === station.name).at(-1);
    const status = agent?.status ?? "Assigned";
    const health = status === "Active" || status === "Completed" || status === "Checked In" ? "Green" : status === "Confirmed" ? "Amber" : "Red";

    return {
      station: station.name,
      ward: station.ward,
      agent: agent?.fullName ?? "Unassigned",
      phone: agent?.phoneNumber ?? "",
      status,
      lastSeen: agent?.lastSeen ?? "",
      turnout: latestTurnout?.turnoutPercentage ?? 0,
      health,
    };
  });
}

export function turnoutTrend() {
  return ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00"].map((interval) => {
    const updates = turnoutUpdates.filter((update) => update.interval === interval);
    const total = updates.reduce((sum, update) => sum + update.totalTurnout, 0);
    const registered = pollingStations.reduce((sum, station) => sum + station.registeredVoters, 0);
    return {
      interval,
      turnout: total,
      percentage: Math.round((total / registered) * 1000) / 10,
    };
  });
}

export function supporterMobilizationAnalytics() {
  return pollingStations.map((station) => {
    const stationSupporters = supporters.filter((supporter) => supporter.pollingStation === station.name);
    const strongSupporters = stationSupporters.filter((supporter) => supporter.supportLevel === "Strong Supporter").length;
    const latestTurnout = turnoutUpdates.filter((update) => update.pollingStation === station.name).at(-1);
    const converted = latestTurnout ? Math.round((strongSupporters / Math.max(latestTurnout.totalTurnout, 1)) * 1000) / 10 : 0;
    return {
      station: station.name,
      ward: station.ward,
      strongSupporters,
      turnout: latestTurnout?.totalTurnout ?? 0,
      turnoutPercentage: latestTurnout?.turnoutPercentage ?? 0,
      conversionSignal: converted,
      recommendation: converted < 3 ? "Dispatch mobilizers" : converted < 6 ? "Call supporter list" : "Hold and monitor",
    };
  });
}

export function pvtTotals() {
  const totals = new Map<string, number>();
  pollingResults.forEach((result) => totals.set(result.candidate, (totals.get(result.candidate) ?? 0) + result.votes));
  const totalVotes = Array.from(totals.values()).reduce((sum, votes) => sum + votes, 0);
  return Array.from(totals, ([candidate, votes]) => ({
    candidate,
    votes,
    share: totalVotes ? Math.round((votes / totalVotes) * 1000) / 10 : 0,
  })).sort((a, b) => b.votes - a.votes);
}

export function pvtQualityQueue() {
  return electionForms
    .filter((form) => form.qualityStatus !== "Verified" || form.suspicious || form.missingFields.length > 0)
    .map((form) => ({
      station: form.pollingStation,
      formType: form.formType,
      status: form.qualityStatus,
      flags: [form.duplicateCheck !== "Clear" ? form.duplicateCheck : "", ...form.missingFields, form.suspicious ? "Suspicious totals" : ""].filter(Boolean).join(", ") || "No flags",
      uploadedBy: form.uploadedBy,
      uploadedAt: form.uploadedAt,
    }));
}

export function campaignHealthScore() {
  const activeVolunteerScore = Math.min(25, volunteers.filter((volunteer) => volunteer.status === "Active").length * 5);
  const supporterScore = Math.min(25, Math.round(supporters.length / 4));
  const coverageScore = Math.min(25, Math.round(summarizePhaseTwo().coveragePercent / 4));
  const communicationScore = featureEntitlements.smsAccess || featureEntitlements.whatsappAccess ? 10 : 0;
  const eventScore = Math.min(15, campaignEvents.filter((event) => event.actualAttendance > 0 || new Date(event.date) >= new Date("2026-06-18")).length * 4);

  return Math.min(100, activeVolunteerScore + supporterScore + coverageScore + communicationScore + eventScore);
}

export function summarizeGovernance() {
  const acceptedInvites = invitations.filter((invite) => invite.status === "Accepted").length;
  const pendingApprovals = teamHierarchy.filter((node) => node.status === "Pending Approval").reduce((sum, node) => sum + node.members, 0);
  const activeCampaigns = electionCycles.filter((election) => election.status === "Active").length;
  const failedLogins = securityEvents.filter((event) => event.event === "Failed Login").length;
  const paidRevenue = payments.filter((payment) => payment.status === "Confirmed").reduce((sum, payment) => sum + payment.amountKes, 0);

  return {
    candidates: candidateProfiles.length,
    acceptedInvites,
    pendingInvites: invitations.filter((invite) => invite.status === "Pending").length,
    pendingApprovals,
    activeCampaigns,
    subscriptionStatus: workspaceSubscription.status,
    healthScore: campaignHealthScore(),
    failedLogins,
    paidRevenue,
  };
}

export function teamHierarchyRows() {
  return teamHierarchy.map((node) => ({
    level: node.level,
    role: node.role,
    name: node.name,
    reportsTo: node.parent ?? "Workspace owner",
    members: node.members,
    status: node.status,
  }));
}

export function platformWorkspaceMetrics() {
  const activeUsers = users.filter((user) => user.status === "Active").length;
  const totalUsers = users.length + invitations.filter((invite) => invite.status === "Pending").length;
  return {
    workspaces: candidateProfiles.length,
    candidates: candidateProfiles.length,
    activeSubscriptions: workspaceSubscription.status === "Active" ? 1 : 0,
    monthlyRecurringRevenue: payments.filter((payment) => payment.status === "Confirmed").reduce((sum, payment) => sum + payment.amountKes, 0),
    activeUsers,
    totalUsers,
    usagePercent: Math.round((totalUsers / workspaceSubscription.userLimit) * 100),
    supportTickets: 2,
  };
}

export function summarizePhaseFive() {
  const donationTotal = donations.reduce((sum, donation) => sum + donation.amountKes, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amountKes, 0);
  const budgetedTotal = budgets.reduce((sum, budget) => sum + budget.budgetedKes, 0);
  const actualTotal = budgets.reduce((sum, budget) => sum + budget.actualKes, 0);
  const fundraisingGoal = fundraisingCampaigns.reduce((sum, item) => sum + item.goalAmountKes, 0);
  const fundraisingRaised = fundraisingCampaigns.reduce((sum, item) => sum + item.raisedKes, 0);
  const confirmedMpesa = mpesaTransactions.filter((transaction) => transaction.status === "Confirmed").reduce((sum, transaction) => sum + transaction.amountKes, 0);
  const competitiveness = predictiveInsights.find((insight) => insight.metric === "Competitiveness")?.estimate ?? 0;

  return {
    aiRecommendations: aiRecommendations.length,
    donationTotal,
    expenseTotal,
    cashBalance: donationTotal - expenseTotal,
    budgetVariance: budgetedTotal - actualTotal,
    fundraisingProgress: fundraisingGoal ? Math.round((fundraisingRaised / fundraisingGoal) * 100) : 0,
    confirmedMpesa,
    competitiveness,
    documents: campaignDocuments.length,
    knowledgeArticles: knowledgeArticles.length,
  };
}

export function summarizeCommunications() {
  const liveRooms = communicationRooms.filter((room) => room.status === "Live").length;
  const scheduledRooms = communicationRooms.filter((room) => room.status === "Scheduled").length;
  const deliveredMessages = communicationMessages.filter((message) => message.status === "Delivered" || message.status === "Sent").length;
  const participants = communicationRooms.reduce((sum, room) => sum + room.participants, 0);

  return {
    rooms: communicationRooms.length,
    liveRooms,
    scheduledRooms,
    deliveredMessages,
    participants,
    solcoStatus: solcoIntegration.status,
  };
}

export function budgetVarianceRows() {
  return budgets.map((budget) => ({
    category: budget.category,
    budgeted: budget.budgetedKes,
    actual: budget.actualKes,
    remaining: budget.budgetedKes - budget.actualKes,
    usedPercent: Math.round((budget.actualKes / budget.budgetedKes) * 100),
  }));
}

export function aiStrategyQueue() {
  return aiRecommendations.slice().sort((a, b) => b.impactScore - a.impactScore);
}

export function reportRows(reportType: string) {
  const byWard = groupCount(supporters, "ward");
  const byStation = groupCount(supporters, "pollingStation");
  const supportLevels = groupCount(supporters, "supportLevel");
  const gender = groupCount(supporters, "gender");
  const age = groupCount(supporters, "ageGroup");
  const issues = groupCount(supporters, "keyIssue");
  const volunteerRows = volunteerPerformance().map((row) => ({
    name: row.name,
    area: row.area,
    supporters: row.supportersRegistered,
    activities: row.activitiesCompleted,
    issues: row.issuesSubmitted,
    events: row.eventsAttended,
    score: row.score,
  }));
  const coverageRows = territoryCoverage().map((row) => ({
    territory: row.name,
    ward: row.ward,
    supporters: row.supporters,
    activity: row.activity,
    events: row.events,
    issues: row.issues,
    score: row.score,
    status: row.status,
  }));
  const issueRows = communityIssues.map((issue) => ({
    issue: issue.title,
    category: issue.category,
    ward: issue.ward,
    village: issue.village,
    mentions: issue.mentions,
    priority: issue.priority,
    status: issue.status,
  }));
  const eventRows = campaignEvents.map((event) => ({
    event: event.title,
    type: event.type,
    date: event.date,
    expected: event.expectedAttendance,
    attendance: event.actualAttendance,
    newSupporters: event.newSupporters,
  }));
  const intelligenceRows = intelligenceReports.map((report) => ({
    title: report.title,
    category: report.category,
    location: report.location,
    urgency: report.urgency,
    submittedBy: report.submittedBy,
    createdAt: report.createdAt,
  }));
  const wardActivityRows = groupCount(fieldVisits, "village").map((row) => ({
    village: row.name,
    fieldVisits: row.value,
  }));
  const agentRows = agentDeploymentRows().map((row) => ({
    pollingStation: row.station,
    ward: row.ward,
    agent: row.agent,
    status: row.status,
    lastSeen: row.lastSeen,
    turnoutPercent: row.turnout,
    health: row.health,
  }));
  const turnoutRows = turnoutTrend().map((row) => ({
    interval: row.interval,
    turnout: row.turnout,
    turnoutPercent: row.percentage,
  }));
  const incidentRows = electionIncidents.map((incident) => ({
    title: incident.title,
    category: incident.category,
    pollingStation: incident.pollingStation,
    urgency: incident.urgency,
    status: incident.status,
    assignedTo: incident.assignedTo,
    createdAt: incident.createdAt,
  }));
  const resultRows = pollingResults.map((result) => ({
    pollingStation: result.pollingStation,
    candidate: result.candidate,
    votes: result.votes,
    rejectedVotes: result.rejectedVotes,
    totalVotes: result.totalVotes,
    verificationStatus: result.verificationStatus,
  }));
  const pvtRows = pvtTotals().map((row) => ({
    candidate: row.candidate,
    votes: row.votes,
    share: row.share,
  }));
  const electionSummary = summarizeElectionOps();
  const electionPerformanceRows = supporterMobilizationAnalytics().map((row) => ({
    pollingStation: row.station,
    ward: row.ward,
    strongSupporters: row.strongSupporters,
    turnout: row.turnout,
    turnoutPercent: row.turnoutPercentage,
    conversionSignal: row.conversionSignal,
    recommendation: row.recommendation,
  }));
  const candidateRows = candidateProfiles.map((candidate) => ({
    candidate: candidate.fullName,
    workspace: candidate.campaignName,
    phone: candidate.phoneNumber,
    position: candidate.positionContesting,
    party: candidate.politicalParty,
    status: candidate.activeStatus,
    verification: candidate.verificationStatus,
  }));
  const invitationRows = invitations.map((invite) => ({
    invitedName: invite.invitedName,
    phone: invite.invitedPhone,
    email: invite.invitedEmail,
    role: invite.role,
    invitedBy: invite.invitedBy,
    status: invite.status,
    expiryDate: invite.expiryDate,
  }));
  const subscriptionRows = [{
    plan: workspaceSubscription.plan,
    status: workspaceSubscription.status,
    startDate: workspaceSubscription.startDate,
    expiryDate: workspaceSubscription.expiryDate,
    userLimit: workspaceSubscription.userLimit,
    volunteerLimit: workspaceSubscription.volunteerLimit,
    pollingAgentLimit: workspaceSubscription.pollingAgentLimit,
    storageGb: workspaceSubscription.storageGb,
  }];
  const paymentRows = payments.map((payment) => ({
    method: payment.method,
    amountKes: payment.amountKes,
    status: payment.status,
    reference: payment.reference,
    createdAt: payment.createdAt,
  }));
  const governanceSummary = summarizeGovernance();
  const phaseFiveSummary = summarizePhaseFive();
  const donationRows = donations.map((donation) => ({
    donor: donation.donorName,
    donorType: donation.donorType,
    phone: donation.phone,
    amountKes: donation.amountKes,
    date: donation.date,
    paymentMethod: donation.paymentMethod,
  }));
  const expenseRows = expenses.map((expense) => ({
    vendor: expense.vendor,
    category: expense.category,
    amountKes: expense.amountKes,
    date: expense.date,
    status: expense.status,
    approvedBy: expense.approvedBy,
  }));
  const fundraisingRows = fundraisingCampaigns.map((campaign) => ({
    title: campaign.title,
    goalAmountKes: campaign.goalAmountKes,
    raisedKes: campaign.raisedKes,
    progress: Math.round((campaign.raisedKes / campaign.goalAmountKes) * 100),
    targetDate: campaign.targetDate,
    status: campaign.status,
  }));
  const mpesaRows = mpesaTransactions.map((transaction) => ({
    purpose: transaction.purpose,
    phone: transaction.phone,
    amountKes: transaction.amountKes,
    method: transaction.method,
    accountReference: transaction.accountReference,
    status: transaction.status,
    createdAt: transaction.createdAt,
  }));
  const aiRows = aiStrategyQueue().map((recommendation) => ({
    title: recommendation.title,
    category: recommendation.category,
    impactScore: recommendation.impactScore,
    source: recommendation.source,
  }));
  const communicationRoomRows = communicationRooms.map((room) => ({
    title: room.title,
    livekitRoomName: room.livekitRoomName,
    purpose: room.purpose,
    status: room.status,
    audience: room.audience,
    scheduledAt: room.scheduledAt,
    host: room.host,
    participants: room.participants,
  }));
  const communicationMessageRows = communicationMessages.map((message) => ({
    channel: message.channel,
    subject: message.subject,
    sender: message.sender,
    audience: message.audience,
    status: message.status,
    sentAt: message.sentAt,
  }));

  const reports: Record<string, Array<Record<string, string | number>>> = {
    "supporters-by-ward": byWard,
    "supporters-by-polling-station": byStation,
    "support-levels-summary": supportLevels,
    "gender-analysis": gender,
    "age-analysis": age,
    "key-issues-analysis": issues,
    "volunteer-performance": volunteerRows,
    "territory-coverage": coverageRows,
    "community-issues": issueRows,
    "event-attendance": eventRows,
    "ground-intelligence-summary": intelligenceRows,
    "ward-activity": wardActivityRows,
    "agent-deployment": agentRows,
    turnout: turnoutRows,
    incident: incidentRows,
    results: resultRows,
    pvt: pvtRows,
    "situation-room-summary": [
      { metric: "Station coverage", value: electionSummary.stationCoverage },
      { metric: "Agent coverage", value: electionSummary.agentCoverage },
      { metric: "Turnout percentage", value: electionSummary.turnoutPercentage },
      { metric: "Open incidents", value: electionSummary.openIncidents },
      { metric: "Verified forms", value: electionSummary.verifiedForms },
      { metric: "Critical alerts", value: electionSummary.criticalAlerts },
    ],
    "election-day-performance": electionPerformanceRows,
    "candidate-management": candidateRows,
    invitations: invitationRows,
    "team-hierarchy": teamHierarchyRows(),
    subscription: subscriptionRows,
    payments: paymentRows,
    "security-events": securityEvents.map((event) => ({
      user: event.user,
      event: event.event,
      device: event.device,
      ipAddress: event.ipAddress,
      createdAt: event.createdAt,
    })),
    "governance-summary": [
      { metric: "Candidates", value: governanceSummary.candidates },
      { metric: "Accepted invites", value: governanceSummary.acceptedInvites },
      { metric: "Pending invites", value: governanceSummary.pendingInvites },
      { metric: "Campaign health score", value: governanceSummary.healthScore },
      { metric: "Failed logins", value: governanceSummary.failedLogins },
      { metric: "Paid revenue KES", value: governanceSummary.paidRevenue },
    ],
    "ai-recommendations": aiRows,
    donations: donationRows,
    expenses: expenseRows,
    budgets: budgetVarianceRows(),
    fundraising: fundraisingRows,
    "mpesa-transactions": mpesaRows,
    "predictive-analytics": predictiveInsights.map((insight) => ({
      metric: insight.metric,
      estimate: insight.estimate,
      label: insight.label,
      caveat: insight.caveat,
    })),
    documents: campaignDocuments.map((document) => ({
      title: document.title,
      category: document.category,
      version: document.version,
      permission: document.permission,
      updatedAt: document.updatedAt,
    })),
    "phase-five-summary": [
      { metric: "AI recommendations", value: phaseFiveSummary.aiRecommendations },
      { metric: "Donation total KES", value: phaseFiveSummary.donationTotal },
      { metric: "Expense total KES", value: phaseFiveSummary.expenseTotal },
      { metric: "Cash balance KES", value: phaseFiveSummary.cashBalance },
      { metric: "Fundraising progress", value: phaseFiveSummary.fundraisingProgress },
      { metric: "Competitiveness", value: phaseFiveSummary.competitiveness },
    ],
    "communication-rooms": communicationRoomRows,
    "communication-messages": communicationMessageRows,
    "communications-summary": [
      { metric: "Rooms", value: summarizeCommunications().rooms },
      { metric: "Live rooms", value: summarizeCommunications().liveRooms },
      { metric: "Scheduled rooms", value: summarizeCommunications().scheduledRooms },
      { metric: "Delivered messages", value: summarizeCommunications().deliveredMessages },
      { metric: "Participants", value: summarizeCommunications().participants },
      { metric: "Solco status", value: summarizeCommunications().solcoStatus },
    ],
  };

  return reports[reportType] ?? byWard;
}
