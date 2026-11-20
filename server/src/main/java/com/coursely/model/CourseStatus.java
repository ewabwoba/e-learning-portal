package com.coursely.model;

/**
 * DRAFT -> PENDING_REVIEW -> PUBLISHED (admin approves) or REJECTED (admin rejects, with a reason; instructor edits and resubmits).
 * ARCHIVED hides a course without deleting it. Only PUBLISHED courses appear in the public catalogue.
 */
public enum CourseStatus { DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED, ARCHIVED }
