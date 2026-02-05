export type AppointmentStatusLegacy = 'scheduled' | 'completed' | 'cancelled';

export const normalizeAppointmentStatus = (status?: string): AppointmentStatusLegacy => {
  const normalized = (status || '').toString().trim().toUpperCase();

  switch (normalized) {
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
    case 'CANCELED':
    case 'NO_SHOW':
      return 'cancelled';
    case 'REQUESTED':
    case 'CONFIRMED':
    case 'CHECKED_IN':
    case 'IN_PROGRESS':
    case 'SCHEDULED':
      return 'scheduled';
    default:
      return (status as AppointmentStatusLegacy) || 'scheduled';
  }
};

export const mapAppointmentStatus = <T extends { status?: string }>(appointment: T): T => {
  return {
    ...appointment,
    status: normalizeAppointmentStatus(appointment.status),
  };
};
