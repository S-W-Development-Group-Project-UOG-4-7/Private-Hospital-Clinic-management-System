<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        Schema::table('appointments', function (Blueprint $table) {
            if (! Schema::hasColumn('appointments', 'visit_mode')) {
                $table->string('visit_mode')->default('PHYSICAL');
                $table->index('visit_mode');
            }
            if (! Schema::hasColumn('appointments', 'booking_channel')) {
                $table->string('booking_channel')->default('FRONTDESK');
                $table->index('booking_channel');
            }
            if (! Schema::hasColumn('appointments', 'scheduled_start')) {
                $table->dateTime('scheduled_start')->nullable();
                $table->index('scheduled_start');
            }
            if (! Schema::hasColumn('appointments', 'scheduled_end')) {
                $table->dateTime('scheduled_end')->nullable();
            }
        });

        $validStatuses = [
            'REQUESTED',
            'CONFIRMED',
            'CHECKED_IN',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED',
            'NO_SHOW',
        ];

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check");
            DB::statement("ALTER TABLE appointments ALTER COLUMN status TYPE VARCHAR(50)");
        }

        DB::table('appointments')
            ->orderBy('id')
            ->chunkById(200, function ($appointments) use ($validStatuses) {
                foreach ($appointments as $appointment) {
                    $updates = [];

                    $visitMode = strtoupper(trim((string) ($appointment->visit_mode ?? '')));
                    if ($visitMode === '') {
                        $type = strtolower(trim((string) ($appointment->type ?? '')));
                        $updates['visit_mode'] = $type === 'telemedicine' ? 'ONLINE' : 'PHYSICAL';
                    }

                    $bookingChannel = strtoupper(trim((string) ($appointment->booking_channel ?? '')));
                    if ($bookingChannel === '') {
                        $updates['booking_channel'] = 'FRONTDESK';
                    }

                    $originalStatus = trim((string) ($appointment->status ?? ''));
                    $normalizedStatus = strtoupper($originalStatus);
                    $statusNeedsUpdate = false;

                    if ($normalizedStatus === '') {
                        $normalizedStatus = 'CONFIRMED';
                        $statusNeedsUpdate = true;
                    } elseif (in_array($normalizedStatus, $validStatuses, true)) {
                        if ($originalStatus !== $normalizedStatus) {
                            $statusNeedsUpdate = true;
                        }
                    } else {
                        switch ($normalizedStatus) {
                            case 'SCHEDULED':
                            case 'BOOKED':
                            case 'CONFIRMED':
                                $normalizedStatus = 'CONFIRMED';
                                break;
                            case 'COMPLETED':
                                $normalizedStatus = 'COMPLETED';
                                break;
                            case 'CANCELLED':
                            case 'CANCELED':
                                $normalizedStatus = 'CANCELLED';
                                break;
                            case 'NO_SHOW':
                            case 'NOSHOW':
                                $normalizedStatus = 'NO_SHOW';
                                break;
                            case 'CHECKED_IN':
                            case 'CHECKED-IN':
                                $normalizedStatus = 'CHECKED_IN';
                                break;
                            case 'IN_PROGRESS':
                            case 'IN_CONSULTATION':
                                $normalizedStatus = 'IN_PROGRESS';
                                break;
                            default:
                                $normalizedStatus = 'CONFIRMED';
                                break;
                        }
                        $statusNeedsUpdate = true;
                    }

                    if ($statusNeedsUpdate) {
                        $updates['status'] = $normalizedStatus;
                    }

                    if (empty($appointment->scheduled_start)) {
                        $start = null;
                        $date = $appointment->appointment_date ?? null;
                        $time = $appointment->appointment_time ?? null;

                        if ($date && $time) {
                            $start = CarbonImmutable::parse("{$date} {$time}");
                        } elseif ($date) {
                            $start = CarbonImmutable::parse($date);
                        }

                        if ($start) {
                            $updates['scheduled_start'] = $start->toDateTimeString();
                            if (empty($appointment->scheduled_end)) {
                                $updates['scheduled_end'] = $start->addMinutes(30)->toDateTimeString();
                            }
                        }
                    }

                    if (! empty($updates)) {
                        DB::table('appointments')->where('id', $appointment->id)->update($updates);
                    }
                }
            });

        // Normalize any remaining casing to uppercase before final validation
        DB::statement("UPDATE appointments SET status = UPPER(status) WHERE status IS NOT NULL");

        // Final safety pass: force any remaining invalid statuses into a valid value
        DB::table('appointments')
            ->where(function ($query) use ($validStatuses) {
                $query->whereNull('status')
                    ->orWhereNotIn('status', $validStatuses);
            })
            ->update(['status' => 'CONFIRMED']);

        if ($driver === 'pgsql') {
            $allowed = "'" . implode("','", $validStatuses) . "'";
            DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ({$allowed}))");
        }
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['visit_mode']);
            $table->dropIndex(['booking_channel']);
            $table->dropIndex(['scheduled_start']);
            $table->dropColumn(['visit_mode', 'booking_channel', 'scheduled_start', 'scheduled_end']);
        });
    }
};
