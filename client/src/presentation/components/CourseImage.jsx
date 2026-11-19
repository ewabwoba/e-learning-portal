import React, { useState } from 'react';
import CourseArt from './CourseArt';

export default function CourseImage({ course, alt = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  if (!course.imageUrl || failed) return <CourseArt category={course.category} />;
  return <img src={course.imageUrl} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />;
}
