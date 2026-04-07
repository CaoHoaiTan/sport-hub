'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client';
import { toast } from 'sonner';
import { Loader2, Search, X, UserCheck } from 'lucide-react';

import { ADD_PLAYER, UPDATE_PLAYER } from '@/graphql/mutations/player';
import { GET_PLAYERS_BY_TEAM } from '@/graphql/queries/player';
import { SEARCH_USERS } from '@/graphql/queries/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';

interface LinkedUser {
  id: string;
  email: string;
  fullName: string;
}

interface PlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  sport?: string;
  editPlayer?: {
    id: string;
    fullName: string;
    jerseyNumber: number;
    position: string | null;
    userId?: string | null;
    linkedUser?: LinkedUser | null;
  } | null;
}

const sportConfig = {
  football: {
    label: 'Bóng đá',
    jerseyRequired: true,
    positionLabel: 'Vị trí',
    positions: [
      { value: 'goalkeeper', label: 'Thủ môn' },
      { value: 'defender', label: 'Hậu vệ' },
      { value: 'midfielder', label: 'Tiền vệ' },
      { value: 'forward', label: 'Tiền đạo' },
    ],
  },
  volleyball: {
    label: 'Bóng chuyền',
    jerseyRequired: true,
    positionLabel: 'Vị trí',
    positions: [
      { value: 'setter', label: 'Chuyền hai' },
      { value: 'libero', label: 'Libero' },
      { value: 'outside_hitter', label: 'Chủ công' },
      { value: 'middle_blocker', label: 'Phụ công' },
      { value: 'opposite', label: 'Đối chuyền' },
    ],
  },
  badminton: {
    label: 'Cầu lông',
    jerseyRequired: false,
    positionLabel: 'Nội dung thi đấu',
    positions: [
      { value: 'singles', label: 'Đơn' },
      { value: 'doubles', label: 'Đôi' },
    ],
  },
} as const;

type SportKey = keyof typeof sportConfig;

export function PlayerForm({
  open,
  onOpenChange,
  teamId,
  sport,
  editPlayer,
}: PlayerFormProps) {
  const config = sportConfig[sport as SportKey] ?? null;

  const [fullName, setFullName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState<string>('none');
  const [selectedUser, setSelectedUser] = useState<LinkedUser | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [showUserResults, setShowUserResults] = useState(false);

  const [searchUsers, { data: searchData, loading: searching }] = useLazyQuery(SEARCH_USERS);

  const debouncedSearch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (value: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (value.trim().length >= 2) {
            searchUsers({ variables: { query: value.trim(), limit: 5 } });
            setShowUserResults(true);
          } else {
            setShowUserResults(false);
          }
        }, 300);
      };
    })(),
    [searchUsers]
  );

  useEffect(() => {
    if (editPlayer) {
      setFullName(editPlayer.fullName);
      setJerseyNumber(String(editPlayer.jerseyNumber ?? ''));
      setPosition(editPlayer.position ?? 'none');
      setSelectedUser(editPlayer.linkedUser ?? null);
      setUserSearch('');
      setShowUserResults(false);
    } else {
      setFullName('');
      setJerseyNumber('');
      setPosition('none');
      setSelectedUser(null);
      setUserSearch('');
      setShowUserResults(false);
    }
  }, [editPlayer]);

  const [addPlayer, { loading: adding }] = useMutation(ADD_PLAYER, {
    refetchQueries: [{ query: GET_PLAYERS_BY_TEAM, variables: { teamId } }],
  });

  const [updatePlayer, { loading: updating }] = useMutation(UPDATE_PLAYER, {
    refetchQueries: [{ query: GET_PLAYERS_BY_TEAM, variables: { teamId } }],
  });

  const isLoading = adding || updating;
  const jerseyRequired = config?.jerseyRequired ?? true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const playerInput = {
      fullName,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : 0,
      position: position && position !== 'none' ? position : null,
    };

    try {
      if (editPlayer) {
        await updatePlayer({
          variables: {
            id: editPlayer.id,
            input: { ...playerInput, userId: selectedUser?.id ?? null },
          },
        });
        toast.success('Cập nhật thành công.');
      } else {
        await addPlayer({
          variables: {
            input: {
              teamId,
              ...playerInput,
              userId: selectedUser?.id ?? null,
            },
          },
        });
        toast.success('Thêm vận động viên thành công.');
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Thao tác thất bại';
      toast.error(message);
    }
  }

  const sportLabel = config?.label ?? 'thể thao';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editPlayer ? 'Sửa thông tin VĐV' : 'Thêm VĐV'}
          </DialogTitle>
          {config && (
            <DialogDescription>
              Môn: {config.label}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name — always shown */}
          <div className="space-y-2">
            <Label htmlFor="player-name">Họ tên *</Label>
            <Input
              id="player-name"
              placeholder="Nhập họ tên vận động viên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Jersey number — required for football/volleyball, optional for badminton */}
          <div className="space-y-2">
            <Label htmlFor="jersey-number">
              Số áo {jerseyRequired ? '*' : '(tùy chọn)'}
            </Label>
            <Input
              id="jersey-number"
              type="number"
              placeholder={sport === 'badminton' ? 'Không bắt buộc' : 'Nhập số áo'}
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              required={jerseyRequired}
              min={0}
              max={99}
            />
          </div>

          {/* Position/Category — different label and options per sport */}
          {config && config.positions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="player-position">{config.positionLabel}</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue placeholder={`Chọn ${config.positionLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  {config.positions.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fallback if sport not specified */}
          {!config && (
            <div className="space-y-2">
              <Label htmlFor="player-position">Vị trí (tùy chọn)</Label>
              <Input
                id="player-position"
                placeholder="Nhập vị trí"
                value={position === 'none' ? '' : position}
                onChange={(e) => setPosition(e.target.value || 'none')}
              />
            </div>
          )}

          {/* Link user account */}
          <div className="space-y-2">
            <Label>Liên kết tài khoản (tùy chọn)</Label>
            {selectedUser ? (
              <div className="flex items-center gap-2 rounded-md border p-2 bg-muted/50">
                <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedUser.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo email hoặc tên..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  onFocus={() => {
                    if (userSearch.trim().length >= 2) setShowUserResults(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowUserResults(false), 200);
                  }}
                  className="pl-9"
                />
                {showUserResults && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-auto">
                    {searching && (
                      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tìm...
                      </div>
                    )}
                    {!searching && searchData?.searchUsers?.length === 0 && (
                      <div className="p-3 text-sm text-muted-foreground">
                        Không tìm thấy tài khoản nào
                      </div>
                    )}
                    {!searching &&
                      searchData?.searchUsers?.map((u: LinkedUser) => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedUser(u);
                            setUserSearch('');
                            setShowUserResults(false);
                          }}
                        >
                          <p className="text-sm font-medium">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Liên kết tài khoản để VĐV có thể tự check-in qua QR code
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editPlayer ? 'Cập nhật' : 'Thêm VĐV'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
