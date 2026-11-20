// Roles and course lifecycle vocabulary shared by every screen.
export const ROLES = { STUDENT: 'STUDENT', INSTRUCTOR: 'INSTRUCTOR', ADMIN: 'ADMIN' };
export const ROLE_LABEL = { STUDENT: 'Student', INSTRUCTOR: 'Instructor', ADMIN: 'Admin' };

/** Where each role lands after signing in. */
export const homeForRole = (role) => (role === 'ADMIN' ? '/app/admin' : role === 'INSTRUCTOR' ? '/app/teach' : '/app');

export const COURSE_STATUS = {
  DRAFT: { label: 'Draft', pill: 'pill-orange' },
  PENDING_REVIEW: { label: 'In review', pill: '' },
  PUBLISHED: { label: 'Published', pill: 'pill-green' },
  REJECTED: { label: 'Needs changes', pill: 'pill-red' },
  ARCHIVED: { label: 'Archived', pill: 'pill-grey' },
};
export const courseStatus = (s) => COURSE_STATUS[s] || COURSE_STATUS.DRAFT;

export const APPROVAL = {
  APPROVED: { label: 'Approved', pill: 'pill-green' },
  PENDING: { label: 'Awaiting approval', pill: 'pill-orange' },
  REJECTED: { label: 'Not approved', pill: 'pill-red' },
};

/** What an instructor may do next with a course, by status. Mirrors the server rules in InstructorService.setStatus. */
export function instructorActions(status) {
  switch (status) {
    case 'DRAFT': return [{ to: 'PENDING_REVIEW', label: 'Submit for review', primary: true }, { to: 'ARCHIVED', label: 'Archive' }];
    case 'REJECTED': return [{ to: 'PENDING_REVIEW', label: 'Resubmit', primary: true }, { to: 'ARCHIVED', label: 'Archive' }];
    case 'PENDING_REVIEW': return [{ to: 'DRAFT', label: 'Withdraw' }];
    case 'PUBLISHED': return [{ to: 'ARCHIVED', label: 'Archive' }];
    case 'ARCHIVED': return [{ to: 'DRAFT', label: 'Restore as draft' }];
    default: return [];
  }
}
