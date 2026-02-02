<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Add stock to Paracetamol
$item = App\Models\InventoryItem::where('name', 'like', '%Paracetamol%')->first();
if ($item) {
    $item->quantity = 100;
    $item->save();
    echo "Updated {$item->name} stock to 100 units\n";
} else {
    echo "Paracetamol not found in inventory\n";
}

// Show all inventory items with low stock
echo "\nCurrent inventory levels:\n";
$items = App\Models\InventoryItem::all(['id', 'name', 'quantity', 'reorder_level']);
foreach ($items as $i) {
    $status = $i->quantity <= $i->reorder_level ? ' [LOW]' : '';
    echo "- {$i->name}: {$i->quantity} units{$status}\n";
}
