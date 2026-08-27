<?php

namespace App\Http\Controllers;

use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Log::with('user')->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('table_name', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('table_name')) {
            $query->where('table_name', $request->table_name);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = $request->input('per_page', 15);
        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $log = Log::with('user')->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Log introuvable',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $log,
        ]);
    }

    public function stats(): JsonResponse
    {
        $total = Log::count();
        $today = Log::whereDate('created_at', today())->count();
        $thisWeek = Log::whereBetween('created_at', [
            now()->startOfWeek(),
            now()->endOfWeek(),
        ])->count();

        $byAction = Log::select('action', DB::raw('count(*) as count'))
            ->groupBy('action')
            ->pluck('count', 'action');

        $byTable = Log::select('table_name', DB::raw('count(*) as count'))
            ->groupBy('table_name')
            ->orderByDesc('count')
            ->limit(10)
            ->pluck('count', 'table_name');

        $recentActivity = Log::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'total'            => $total,
                'today'            => $today,
                'this_week'        => $thisWeek,
                'by_action'        => $byAction,
                'by_table'         => $byTable,
                'recent_activity'  => $recentActivity,
            ],
        ]);
    }

    public function tables(): JsonResponse
    {
        $tables = Log::distinct()
            ->pluck('table_name')
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'data'    => $tables,
        ]);
    }
}
