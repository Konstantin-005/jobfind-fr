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
