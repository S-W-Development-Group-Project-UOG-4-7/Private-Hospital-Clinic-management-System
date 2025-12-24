<?php

namespace App\Console\Commands;

use App\Models\InventoryItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckReorderLevels extends Command
{
    protected $signature = 'inventory:check-reorder-levels';
    protected $description = 'Check inventory items that are below reorder level and log them';

    public function handle()
    {
        $lowStockItems = InventoryItem::whereRaw('quantity <= reorder_level')
            ->where('is_active', true)
            ->with('supplier')
            ->get();

        if ($lowStockItems->isEmpty()) {
            $this->info('No items below reorder level.');
            return 0;
        }

        $this->warn("Found {$lowStockItems->count()} item(s) below reorder level:");

        foreach ($lowStockItems as $item) {
            $message = sprintf(
                "Item: %s (ID: %d) - Current: %d, Reorder Level: %d, Supplier: %s",
                $item->name,
                $item->id,
                $item->quantity,
                $item->reorder_level,
                $item->supplier?->name ?? 'No supplier'
            );

            $this->line($message);
            Log::warning('Low stock alert', [
                'item_id' => $item->id,
                'item_name' => $item->name,
                'quantity' => $item->quantity,
                'reorder_level' => $item->reorder_level,
                'supplier_id' => $item->supplier_id,
            ]);
        }

        return 0;
    }
}

