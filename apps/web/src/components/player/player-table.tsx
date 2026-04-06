'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { Pencil, Trash2 } from 'lucide-react';

interface Player {
  id: string;
  fullName: string;
  jerseyNumber: number | null;
  position: string | null;
  isCaptain: boolean;
  isActive: boolean;
}

interface PlayerTableProps {
  players: Player[];
  isLoading?: boolean;
  onEdit?: (player: Player) => void;
  onRemove?: (playerId: string) => void;
}

export function PlayerTable({
  players,
  isLoading = false,
  onEdit,
  onRemove,
}: PlayerTableProps) {
  const columns = [
    {
      key: 'jerseyNumber',
      header: '#',
      className: 'w-16',
      render: (row: Player) => (
        <span className="font-mono font-bold text-muted-foreground">
          {row.jerseyNumber != null ? `#${row.jerseyNumber}` : '-'}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Name',
      render: (row: Player) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.fullName}</span>
          {row.isCaptain && (
            <Badge variant="secondary" className="text-[10px]">
              Captain
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Position',
      render: (row: Player) => (
        <span className="capitalize text-sm">
          {row.position?.replace('_', ' ') ?? '-'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: Player) => (
        <Badge
          variant={row.isActive ? 'success' : 'secondary'}
          className="text-[10px]"
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    ...(onEdit || onRemove
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-24',
            render: (row: Player) => (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit(row)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => onRemove(row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={players as Array<Player & Record<string, unknown>>}
      isLoading={isLoading}
      emptyMessage="No players"
      emptyDescription="No players have been added to this team."
      keyExtractor={(row) => row.id}
    />
  );
}
