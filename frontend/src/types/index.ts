/**
 * PlacementPilot AI — TypeScript Type Definitions
 *
 * Central type definitions for all data structures used across the frontend.
 */

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
  api_key_configured: boolean;
  mcp_server_status: string;
  agents: Record<string, string>;
}

export interface RoleMetadata {
  id: string;
  title: string;
  description: string;
  industry: string;
  difficulty: string;
  average_preparation_weeks: number;
}

export interface RolesResponse {
  roles: RoleMetadata[];
  total_count: number;
}

export interface ResourceItem {
  name: string;
  url: string;
  type: string;
  free: boolean;
  category?: string;
}

export interface ResourcesResponse {
  resources: ResourceItem[];
  categories: string[];
}

// ──────────────────────────────────────────────
// Profile Data (from Profile Intelligence Agent)
// ──────────────────────────────────────────────

export interface Education {
  degree: string;
  field: string;
  level: string;
  graduation_status: string;
}

export interface Internship {
  role: string;
  duration: string;
  description: string;
  technologies_used: string[];
}

export interface Project {
  title: string;
  description: string;
  technologies_used: string[];
  key_achievements: string[];
}

export interface ProfileData {
  summary: string;
  technical_skills: string[];
  soft_skills: string[];
  programming_languages: string[];
  frameworks_and_tools: string[];
  education: Education[];
  certifications: string[];
  internships: Internship[];
  projects: Project[];
  experience_years: string;
  strengths: string[];
  warnings: string[];
}

// ──────────────────────────────────────────────
// Career Analysis (from Career Intelligence Agent)
// ──────────────────────────────────────────────

export interface MissingSkill {
  skill: string;
  importance: string;
  reason: string;
}

export interface SectionImprovement {
  section: string;
  suggestion: string;
}

export interface ATSAnalysis {
  matched_keywords: string[];
  missing_keywords: string[];
  keyword_suggestions: string[];
  section_improvements: SectionImprovement[];
}

export interface JDAnalysis {
  jd_match_score: number;
  jd_matched_keywords: string[];
  jd_missing_keywords: string[];
  jd_suggestions: string[];
}

export interface CareerAnalysis {
  target_role: string;
  ats_score: number;
  placement_readiness_score: number;
  matching_skills: {
    must_have: string[];
    good_to_have: string[];
  };
  missing_skills: {
    must_have: MissingSkill[];
    good_to_have: MissingSkill[];
  };
  ats_analysis: ATSAnalysis;
  strengths: string[];
  areas_for_improvement: string[];
  overall_assessment: string;
  jd_specific_analysis: JDAnalysis | null;
}

// ──────────────────────────────────────────────
// Coaching Plan (from Career Coach Agent)
// ──────────────────────────────────────────────

export interface DailyTask {
  day: string;
  task: string;
  hours: number;
}

export interface WeeklyGoal {
  week: number;
  title: string;
  objectives: string[];
  daily_tasks: DailyTask[];
  milestone: string;
}

export interface Phase {
  phase_number: number;
  phase_name: string;
  duration_weeks: number;
  focus_area: string;
  weekly_goals: WeeklyGoal[];
}

export interface Roadmap {
  total_weeks: number;
  phases: Phase[];
}

export interface SuggestedProject {
  title: string;
  description: string;
  skills_developed: string[];
  difficulty: string;
  estimated_hours: number;
  steps: string[];
  portfolio_value: string;
}

export interface TechnicalTopic {
  topic: string;
  subtopics: string[];
  resources: string[];
  estimated_prep_hours: number;
}

export interface BehavioralQuestion {
  question_type: string;
  sample_questions: string[];
  tips: string[];
}

export interface InterviewPreparation {
  technical_checklist: TechnicalTopic[];
  behavioral_checklist: BehavioralQuestion[];
  mock_interview_plan: {
    frequency: string;
    platforms: string[];
    focus_areas: string[];
  };
}

export interface LearningResource {
  name: string;
  url: string;
  type: string;
  free: boolean;
  estimated_hours: number;
  priority: string;
}

export interface LearningCategory {
  category: string;
  resources: LearningResource[];
}

export interface CertificationRecommendation {
  name: string;
  provider: string;
  reason: string;
  timeline: string;
  cost: string;
}

export interface FinalRecommendations {
  top_priorities: string[];
  quick_wins: string[];
  long_term_goals: string[];
  motivation: string;
  estimated_readiness_date: string;
}

export interface CoachingPlan {
  roadmap: Roadmap;
  suggested_projects: SuggestedProject[];
  interview_preparation: InterviewPreparation;
  learning_resources: LearningCategory[];
  certifications_recommended: CertificationRecommendation[];
  final_recommendations: FinalRecommendations;
}

// ──────────────────────────────────────────────
// Full Analysis Result
// ──────────────────────────────────────────────

export interface AnalysisResult {
  status: string;
  message?: string;
  profile_data: ProfileData | null;
  career_analysis: CareerAnalysis | null;
  coaching_plan: CoachingPlan | null;
}

// ──────────────────────────────────────────────
// UI State Types
// ──────────────────────────────────────────────

export type AnalysisStep = 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'coaching' | 'complete' | 'error';

export interface AppState {
  selectedRole: string;
  analysisResult: AnalysisResult | null;
  analysisStep: AnalysisStep;
  roles: RoleMetadata[];
  error: string | null;
}
