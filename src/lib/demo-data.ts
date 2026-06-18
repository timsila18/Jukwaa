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

export const campaign = {
  tenantId: "demo-tenant",
  campaignName: "Demo Campaign",
  candidateName: "John Doe",
  positionTargeted: "MP",
  politicalParty: "Independent",
  county: "Configurable County",
  constituency: "Central Constituency",
  electionYear: 2027,
  slogan: "Service, dignity, delivery",
  primaryColor: "#0f766e",
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
  };

  return reports[reportType] ?? byWard;
}
