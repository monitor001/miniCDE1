import { Router } from 'express';
import {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  updateAttendeeStatus
} from '../controllers/calendarController';

const router = Router();

router.get('/', getCalendarEvents);
router.get('/:id', getCalendarEventById);
router.post('/', createCalendarEvent);
router.put('/:id', updateCalendarEvent);
router.delete('/:id', deleteCalendarEvent);
router.patch('/:eventId/attendee/status', updateAttendeeStatus);

export default router; 