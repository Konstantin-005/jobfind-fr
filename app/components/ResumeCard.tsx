import Link from 'next/link';
import { useState } from 'react';
import { Resume, WorkExperience } from '../types/resume';

interface ResumeCardProps {
  resume: Resume;
  onOfferClick?: () => void;
}

function WorkExperienceItem({ experience }: { experience: WorkExperience }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="mb-2 last:mb-0">
      {(() => {
        const start = `${experience.start_month}/${experience.start_year}`;
        const end = experience.is_current
          ? 'Наст. время'
          : `${experience.end_month}/${experience.end_year}`;
        const period = `${start} — ${end}`;

        return (
          <>
            <div className="font-medium text-gray-900">
              {experience.company_name}
            </div>
            <div className="text-gray-700 mt-0.5">
              {experience.position} • {period}
            </div>
          </>
        );
      })()}
      {experience.responsibilities && (
        <div className="mt-1 text-gray-700">
          <div 
            className={`${!isExpanded ? 'line-clamp-1' : ''}`}
            dangerouslySetInnerHTML={{ __html: experience.responsibilities }}
          />
          {experience.responsibilities.length > 100 && (
            <button
              onClick={toggleExpand}
              className="text-blue-600 hover:text-blue-700 text-xs mt-1 font-medium"
            >
              {isExpanded ? 'Свернуть' : 'Показать полностью'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResumeCard({ resume, onOfferClick }: ResumeCardProps) {
  const pluralize = (num: number, one: string, two: string, five: string) => {
    let n = Math.abs(num);
    n %= 100;
    if (n >= 5 && n <= 20) return five;
    n %= 10;
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return two;
    return five;
  };

  const getAgeFromProfile = () => {
    const age = resume.job_seeker_profile.age_years;
    if (typeof age !== 'number' || Number.isNaN(age) || age <= 0) return null;
    return age;
  };

  const calculateTotalExperience = () => {
    if (!resume.work_experiences || resume.work_experiences.length === 0) {
      return 'Без опыта';
    }

    let totalMonths = 0;
    resume.work_experiences.forEach(exp => {
      const startDate = new Date(exp.start_year, exp.start_month - 1);
      const endDate = exp.is_current 
        ? new Date() 
        : new Date(exp.end_year || exp.start_year, (exp.end_month || exp.start_month) - 1);
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
      totalMonths += months;
    });

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const parts = [];
    if (years) parts.push(`${years} ${pluralize(years, 'год', 'года', 'лет')}`);
    if (months) parts.push(`${months} ${pluralize(months, 'месяц', 'месяца', 'месяцев')}`);
    return parts.length > 0 ? parts.join(' ') : 'Менее месяца';
  };

  const getJobSearchStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'actively_looking': { label: 'Активно ищет работу', color: 'bg-green-50 text-green-700' },
      'considering_offers': { label: 'Рассматривает предложения', color: 'bg-blue-50 text-blue-700' },
      'not_looking': { label: 'Не ищет работу', color: 'bg-gray-50 text-gray-700' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-50 text-gray-700' };
  };

  const getUpdateDateLabel = (dateString: string) => {
    const updateDate = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const updateDay = new Date(updateDate.getFullYear(), updateDate.getMonth(), updateDate.getDate());
    
    const diffTime = today.getTime() - updateDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let label = '';
    let isRecent = false;
    
    if (diffDays === 0) {
      label = 'Обновлено сегодня';
      isRecent = true;
    } else if (diffDays === 1) {
      label = 'Обновлено вчера';
      isRecent = true;
    } else if (diffDays <= 7) {
      label = `Обновлено ${updateDate.toLocaleDateString('ru-RU')}`;
      isRecent = true;
    } else {
      label = `Обновлено ${updateDate.toLocaleDateString('ru-RU')}`;
    }
    
    return { label, isRecent };
  };

  const age = getAgeFromProfile();
  const statusInfo = getJobSearchStatusLabel(resume.job_seeker_profile.job_search_status);
  const updateInfo = getUpdateDateLabel(resume.updated_at);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow mb-4">
      <div className="flex gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={
              resume.photo_url
                ? "w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 bg-white"
                : "w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 bg-gray-100 text-gray-500"
            }
          >
            {resume.photo_url ? (
              <img src={`/uploads/photo/${resume.photo_url}`} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <Link href={`/resume/${resume.link_uuid}`} className="text-xl font-bold text-blue-600 hover:text-blue-700">
                  {resume.title}
                </Link>
                <span className={`text-xs ${updateInfo.isRecent ? 'text-green-600' : 'text-gray-400'}`}>
                  {updateInfo.label}
                </span>
              </div>
              
              {resume.salary_expectation && (
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  {resume.salary_expectation.toLocaleString('ru-RU')} ₽
                </div>
              )}

              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <span>
                  {age
                    ? `${age} ${pluralize(age, 'год', 'года', 'лет')}`
                    : 'Возраст не указан'}
                  {resume.job_seeker_profile.gender === 'male' && ', М'}
                  {resume.job_seeker_profile.gender === 'female' && ', Ж'}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="text-sm text-gray-600 mt-1">
                {resume.job_seeker_profile.city_name && <span>{resume.job_seeker_profile.city_name}</span>}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* Профессия */}
            {resume.profession_name && (
              <div className="flex gap-4">
                <div className="text-gray-500 text-sm w-32 flex-shrink-0">Профессия</div>
                <div className="text-gray-900 text-sm font-medium">{resume.profession_name}</div>
              </div>
            )}

            {/* Опыт работы */}
            <div className="flex gap-4">
              <div className="text-gray-500 text-sm w-32 flex-shrink-0">Опыт работы</div>
              <div className="text-gray-900 text-sm font-medium">
                {calculateTotalExperience()}
              </div>
            </div>

            {/* Места работы */}
            {resume.work_experiences && resume.work_experiences.length > 0 && (
              <div className="flex gap-4">
                <div className="text-gray-500 text-sm w-32 flex-shrink-0">Места работы</div>
                <div className="text-sm flex-grow">
                  {resume.work_experiences.slice(0, 2).map((exp, idx) => (
                    <WorkExperienceItem key={idx} experience={exp} />
                  ))}
                </div>
              </div>
            )}

            {/* Образование */}
            {resume.educations && resume.educations.length > 0 && (
              <div className="flex gap-4">
                <div className="text-gray-500 text-sm w-32 flex-shrink-0">Образование</div>
                <div className="text-sm flex-grow">
                  <div className="text-gray-900 font-medium mb-1">{resume.education_type?.name}</div>
                  {resume.educations.map((edu, idx) => (
                    <div key={idx} className="mb-2 last:mb-0 text-gray-700">
                      <div>{edu.institution_name}</div>
                      {edu.specialization_name && (
                        <div className="text-gray-600">{edu.specialization_name}</div>
                      )}
                      <div className="text-gray-500 text-xs">Год окончания: {edu.end_year}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Языки */}
            {resume.job_seeker_profile.languages && resume.job_seeker_profile.languages.length > 0 && (
              <div className="flex gap-4">
                <div className="text-gray-500 text-sm w-32 flex-shrink-0">Языки</div>
                <div className="text-sm text-gray-900">
                  {resume.job_seeker_profile.languages.map(l => `${l.name} (${l.proficiency_level})`).join(', ')}
                </div>
              </div>
            )}

          </div>

          {onOfferClick && (
            <div className="mt-6 flex justify-start">
              <button
                type="button"
                onClick={onOfferClick}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Предложить вакансию
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
