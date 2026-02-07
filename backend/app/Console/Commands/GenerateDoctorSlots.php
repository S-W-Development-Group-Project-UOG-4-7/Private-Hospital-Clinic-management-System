<?php

namespace App\Console\Commands;

use App\Models\DoctorSchedule;
use App\Models\Slot;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class GenerateDoctorSlots extends Command
{
    protected $signature = 'slots:generate
        {--from= : Start date (YYYY-MM-DD)}
        {--days=7 : Number of days to generate}
        {--interval=30 : Slot length in minutes}
        {--default-start=08:00 : Default start time if no schedule exists}
        {--default-end=22:00 : Default end time if no schedule exists}';

    protected $description = 'Generate appointment slots for doctors based on schedules or default hours.';

    public function handle(): int
    {
        $from = $this->option('from');
        $days = (int) $this->option('days');
        $intervalMinutes = (int) $this->option('interval');
        $defaultStart = (string) $this->option('default-start');
        $defaultEnd = (string) $this->option('default-end');

        if ($days <= 0) {
            $this->error('Days must be greater than 0.');
            return self::FAILURE;
        }

        $startDate = $from ? CarbonImmutable::parse($from)->startOfDay() : CarbonImmutable::now()->startOfDay();
        $endDate = $startDate->addDays($days);

        $doctors = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'doctor'))
            ->get();

        $created = 0;

        foreach ($doctors as $doctor) {
            for ($date = $startDate; $date->lt($endDate); $date = $date->addDay()) {
                $schedules = DoctorSchedule::query()
                    ->where('doctor_id', $doctor->id)
                    ->whereDate('schedule_date', $date->format('Y-m-d'))
                    ->where('is_available', true)
                    ->get();

                if ($schedules->isEmpty()) {
                    $schedules = collect([new DoctorSchedule([
                        'schedule_date' => $date,
                        'start_time' => $defaultStart,
                        'end_time' => $defaultEnd,
                    ])]);
                }

                foreach ($schedules as $schedule) {
                    $startTime = CarbonImmutable::parse($date->format('Y-m-d') . ' ' . $schedule->start_time);
                    $endTime = CarbonImmutable::parse($date->format('Y-m-d') . ' ' . $schedule->end_time);

                    $current = $startTime;
                    while ($current->lt($endTime)) {
                        $slotStart = $current;
                        $slotEnd = $current->addMinutes($intervalMinutes);
                        if ($slotEnd->gt($endTime)) {
                            break;
                        }

                        $slot = Slot::firstOrCreate([
                            'doctor_id' => $doctor->id,
                            'date' => $date->format('Y-m-d'),
                            'start_time' => $slotStart->format('H:i:s'),
                            'end_time' => $slotEnd->format('H:i:s'),
                        ], [
                            'allowed_visit_mode' => 'PHYSICAL',
                            'status' => 'AVAILABLE',
                        ]);

                        if ($slot->wasRecentlyCreated) {
                            $created++;
                        }

                        $current = $slotEnd;
                    }
                }
            }
        }

        $this->info("Slot generation complete. Created {$created} slots.");

        return self::SUCCESS;
    }
}
