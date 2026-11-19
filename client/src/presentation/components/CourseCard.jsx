import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock3 } from 'lucide-react';
import CourseImage from './CourseImage';
import Stars from './Stars';
import { formatDuration, formatPrice } from '../../domain/course';

/**
 * Catalogue card. `enrollment` switches the footer to a progress read-out; `to` is the detail route.
 */
export default function CourseCard({ course, to, variant = 'grid', saved = false, onSave, enrollment, index = 0 }) {
  const featured = course.badge === 'FEATURED';
  const showBadge = course.badge && !featured;
  return (
    <article className={`course-card ${variant === 'list' ? 'list' : ''} ${featured ? 'featured' : ''}`} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <div className="course-media">
        <CourseImage course={course} />
        {featured && <div className="ribbon-wrap"><span className="ribbon">FEATURED</span></div>}
        {showBadge && <span className={`badge badge-${course.badge}`}>{course.badge}</span>}
        {enrollment && (<><div className="media-progress" aria-hidden><span style={{ width: `${enrollment.progressPercent}%` }} /></div></>)}
        {onSave && (
          <button type="button" className="save-btn" aria-pressed={saved} aria-label={saved ? `Remove ${course.title} from saved` : `Save ${course.title}`} onClick={() => onSave(course.id)}>
            <Bookmark size={17} />
          </button>
        )}
      </div>
      <div className="course-body">
        <span className="course-cat">{course.category}</span>
        <h3 className="course-title"><Link to={to}>{course.title}</Link></h3>
        <p className="course-by">By {course.instructor?.name}</p>
        <p className="course-desc">{course.description}</p>
        {enrollment ? (
          <div className="course-progress-row">
            <div className="progress" role="progressbar" aria-valuenow={enrollment.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress"><span style={{ width: `${enrollment.progressPercent}%` }} /></div>
            <span>{enrollment.progressPercent}% complete · {enrollment.completedLessons}/{enrollment.totalLessons} lessons</span>
          </div>
        ) : (
          <div className="course-foot">
            {course.rating ? (
              <span className="rating"><Stars value={course.rating} size={13} /> <span className="num">{Number(course.rating).toFixed(course.rating % 1 ? 1 : 0)}</span></span>
            ) : (
              <span className="meta"><Clock3 size={15} aria-hidden /> {formatDuration(course.durationMinutes)}</span>
            )}
            <span className="price">
              {course.originalPrice > course.price && <s><span className="sr-only">Was </span>{formatPrice(course.originalPrice)}</s>}
              <strong>{formatPrice(course.price)}</strong>
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
