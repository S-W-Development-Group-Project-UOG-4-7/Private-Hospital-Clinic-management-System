<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function index()
    {
        $defaults = $this->defaults();
        $settings = SystemSetting::query()
            ->whereIn('key', array_keys($defaults))
            ->pluck('value', 'key')
            ->toArray();

        return response()->json($this->buildResponse($settings, $defaults));
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'appointment.slot_length_minutes' => 'required|integer|min:5|max:180',
            'appointment.cancellation_window_hours' => 'required|integer|min:0|max:168',
            'fees.consultation' => 'required|numeric|min:0',
            'fees.lab_markup_percent' => 'required|numeric|min:0|max:100',
            'fees.pharmacy_markup_percent' => 'required|numeric|min:0|max:100',
        ]);

        $defaults = $this->defaults();
        $before = SystemSetting::query()
            ->whereIn('key', array_keys($defaults))
            ->pluck('value', 'key')
            ->toArray();

        $userId = $request->user()?->id;

        foreach ($defaults as $key => $defaultValue) {
            $value = data_get($validated, $key, $defaultValue);

            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'updated_by' => $userId]
            );
        }

        $after = SystemSetting::query()
            ->whereIn('key', array_keys($defaults))
            ->pluck('value', 'key')
            ->toArray();

        $request->attributes->set('audit.entity_type', 'system_setting');
        $request->attributes->set('audit.entity_id', null);
        $request->attributes->set('audit.before', $before);
        $request->attributes->set('audit.after', $after);

        return response()->json($this->buildResponse($after, $defaults));
    }

    private function defaults(): array
    {
        return [
            'appointment.slot_length_minutes' => 15,
            'appointment.cancellation_window_hours' => 24,
            'fees.consultation' => 0,
            'fees.lab_markup_percent' => 0,
            'fees.pharmacy_markup_percent' => 0,
        ];
    }

    private function buildResponse(array $settings, array $defaults): array
    {
        $merged = array_merge($defaults, $settings);

        return [
            'appointment' => [
                'slot_length_minutes' => $merged['appointment.slot_length_minutes'],
                'cancellation_window_hours' => $merged['appointment.cancellation_window_hours'],
            ],
            'fees' => [
                'consultation' => $merged['fees.consultation'],
                'lab_markup_percent' => $merged['fees.lab_markup_percent'],
                'pharmacy_markup_percent' => $merged['fees.pharmacy_markup_percent'],
            ],
        ];
    }
}
