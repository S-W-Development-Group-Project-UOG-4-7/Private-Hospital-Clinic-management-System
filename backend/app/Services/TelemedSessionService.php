<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\VideoSession;
use Illuminate\Support\Str;
use InvalidArgumentException;

class TelemedSessionService
{
    public function createForAppointment(Appointment $appointment): VideoSession
    {
        if ($appointment->visit_mode !== Appointment::VISIT_MODE_ONLINE) {
            throw new InvalidArgumentException('Video session is only allowed for ONLINE appointments.');
        }

        $existing = $appointment->videoSession;
        if ($existing) {
            return $existing;
        }

        $roomId = $this->generateUniqueRoomId();
        $baseUrl = rtrim((string) config('services.jitsi.base_url', 'https://meet.jit.si'), '/');
        $joinUrl = $baseUrl . '/' . $roomId;

        return VideoSession::create([
            'appointment_id' => $appointment->id,
            'provider' => 'JITSI',
            'room_id' => $roomId,
            'join_url_patient' => $joinUrl,
            'join_url_doctor' => $joinUrl,
            'status' => 'CREATED',
        ]);
    }

    private function generateUniqueRoomId(): string
    {
        do {
            $roomId = Str::random(20);
        } while (VideoSession::where('room_id', $roomId)->exists());

        return $roomId;
    }
}
