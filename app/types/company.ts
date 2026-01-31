export interface CompanyAddress {
  address_id: number;
  address: string;
  city_id: number;
  city?: {
    city_id: number;
    name: string;
  };
  district_id?: number;
  district?: {
    district_id: number;
    name: string;
  };
  company_id: number;
}

export interface Industry {
  industry_id: number;
  name: string;
}

export interface CompanyEmployee {
  employee_id: number;
  user_id: string; // UUID
  company_id: number;
  position: string;
  department?: string;
  hire_date: string;
  is_admin: boolean;
  telegram?: string;
  whatsapp?: string;
}

export interface CompanyProfile {
  id: number;
  user_id: string; // UUID
  company_name: string;
  brand_name?: string;
  description?: string;
  email?: string;
  website_url?: string;
  logo_url?: string;
  founded_year?: number;
  company_size?: string;
  company_type?: string;
  is_it_company?: boolean;
  inn?: string;
  industries?: Industry[];
  addresses?: CompanyAddress[];
  employees?: CompanyEmployee[];
}

export interface PublicCompanyListItem {
  company_id: number;
  company_name: string;
  brand_name?: string;
  logo_url?: string;
  description?: string;
  company_size?: string;
  company_type?: string;
  industries?: Industry[];
  addresses?: CompanyAddress[];
  active_jobs_count: number;
}

export interface CompanyPublicCity {
  city_id: number;
  name: string;
}

export interface CompanyPublicLocation {
  city?: CompanyPublicCity;
  region?: {
    region_id: number;
    name: string;
  };
}

export interface CompanyJobListItem {
  job_id: number;
  company_id: number;
  company_name: string;
  title: string;
  work_experience?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_type?: string;
  salary_period?: string;
  is_promo?: boolean;
  no_resume_apply?: boolean;
  logo_url?: string;
  addresses?: {
    city?: string;
    city_name_prepositional?: string;
    address?: string;
  }[];
  work_format_ids?: number[];
}

export interface PublicCompanyDetail {
  company_id: number;
  company_name: string;
  brand_name?: string;
  logo_url?: string;
  description?: string;
  website_url?: string;
  company_type?: string;
  is_it_company?: boolean;
  founded_year?: number;
  company_size?: string;
  industries: Industry[];
  location?: CompanyPublicLocation;
  jobs: CompanyJobListItem[];
}
