export interface Resume {
  profession_name?: string | null;
  photo_url?: string | null;
  title: string;
  salary_expectation?: number | null;
  professional_summary?: string | null;
  link_uuid: string;
  business_trips?: string | null;
  created_at: string;
  updated_at: string;
  job_seeker_profile: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    age_years?: number;
    gender: string;
    job_search_status: string;
    city_name?: string;
    metro_station_name?: string | null;
    languages: Array<{
      name: string;
      proficiency_level: string;
    }>;
  };
  education_type: {
    education_type_id: number;
    name: string;
  };
  employment_types: Array<{
    employment_type_id: number;
    name: string;
  }>;
  work_formats: Array<{
    work_format_id: number;
    name: string;
  }>;
  work_experiences: WorkExperience[];
  educations: Education[];
  resume_skills: ResumeSkill[];
}

export interface WorkExperience {
  company_name: string;
  position: string;
  start_year: number;
  start_month: number;
  end_year?: number | null;
  end_month?: number | null;
  is_current: boolean;
  responsibilities?: string;
}

export interface Education {
  end_year: number;
  institution_name: string;
  specialization_name?: string;
}

export interface ResumeSkill {
  skill_id?: number;
  skill?: {
    name: string;
  };
}

export interface SearchResumesResponse {
  data: Resume[];
  limit: number;
  page: number;
  total: number;
}
