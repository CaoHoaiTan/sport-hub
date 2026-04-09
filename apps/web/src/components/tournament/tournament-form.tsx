'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants';
import { formatVND } from '@/lib/utils/format';
import { CREATE_TOURNAMENT } from '@/graphql/mutations/tournament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { SPORT_RULES } from '@sporthub/shared';

const BADMINTON_CATEGORIES = [
  { value: 'singles_men', label: 'Đơn nam' },
  { value: 'singles_women', label: 'Đơn nữ' },
  { value: 'doubles_men', label: 'Đôi nam' },
  { value: 'doubles_women', label: 'Đôi nữ' },
  { value: 'mixed_doubles', label: 'Đôi nam nữ (Mixed)' },
] as const;

const BADMINTON_PLAYERS: Record<string, { min: number; max: number }> = {
  singles_men: { min: 1, max: 1 },
  singles_women: { min: 1, max: 1 },
  doubles_men: { min: 2, max: 2 },
  doubles_women: { min: 2, max: 2 },
  mixed_doubles: { min: 2, max: 2 },
};

const VOLLEYBALL_CATEGORIES = [
  { value: 'men', label: 'Bóng chuyền nam', playersOnCourt: 6, maxRoster: 14 },
  { value: 'women', label: 'Bóng chuyền nữ', playersOnCourt: 6, maxRoster: 14 },
  { value: 'mixed', label: 'Bóng chuyền nam nữ (Mixed)', playersOnCourt: 6, maxRoster: 14 },
  { value: 'beach_men', label: 'Bóng chuyền bãi biển nam', playersOnCourt: 2, maxRoster: 2 },
  { value: 'beach_women', label: 'Bóng chuyền bãi biển nữ', playersOnCourt: 2, maxRoster: 2 },
  { value: 'beach_mixed', label: 'Bóng chuyền bãi biển nam nữ', playersOnCourt: 2, maxRoster: 2 },
] as const;

interface FormatOption {
  value: string;
  label: string;
  description: string;
}

const FORMATS_BY_SPORT: Record<string, FormatOption[]> = {
  football: [
    {
      value: 'round_robin',
      label: 'Vòng tròn',
      description: 'Mỗi đội đấu với tất cả các đội khác. Xếp hạng theo điểm số (thắng/hòa/thua). Phù hợp khi số đội ít (≤ 8 đội).',
    },
    {
      value: 'single_elimination',
      label: 'Loại trực tiếp',
      description: 'Thua 1 trận là bị loại. Nhanh gọn, phù hợp giải nhiều đội. Có thể kết hợp hiệp phụ và penalty.',
    },
    {
      value: 'double_elimination',
      label: 'Loại kép',
      description: 'Phải thua 2 trận mới bị loại. Gồm nhánh thắng và nhánh thua. Công bằng hơn nhưng kéo dài hơn.',
    },
    {
      value: 'group_stage_knockout',
      label: 'Vòng bảng + Loại trực tiếp',
      description: 'Chia bảng đấu vòng tròn, các đội đứng đầu vào vòng loại trực tiếp. Giống World Cup — phù hợp giải lớn.',
    },
  ],
  volleyball: [
    {
      value: 'round_robin',
      label: 'Vòng tròn',
      description: 'Mỗi đội đấu với tất cả đội khác, xếp hạng theo tỉ số set thắng/thua và điểm.',
    },
    {
      value: 'single_elimination',
      label: 'Loại trực tiếp',
      description: 'Thua 1 trận là bị loại. Phù hợp giải ngắn ngày, nhiều đội.',
    },
    {
      value: 'group_stage_knockout',
      label: 'Vòng bảng + Loại trực tiếp',
      description: 'Chia bảng đấu vòng tròn theo set, đội đứng đầu vào vòng knock-out.',
    },
  ],
  badminton: [
    {
      value: 'single_elimination',
      label: 'Loại trực tiếp',
      description: 'Thua 1 trận là bị loại. Thể thức phổ biến nhất cho cầu lông (giống các giải BWF).',
    },
    {
      value: 'group_stage_knockout',
      label: 'Vòng bảng + Loại trực tiếp',
      description: 'Chia bảng đấu vòng tròn, VDV/đôi đứng đầu vào vòng loại.',
    },
    {
      value: 'round_robin',
      label: 'Vòng tròn',
      description: 'Tất cả VDV/đôi đấu với nhau. Phù hợp khi số lượng ít (≤ 6).',
    },
  ],
};

interface SportDefaults {
  minPlayers: number;
  maxPlayers: number;
  matchDuration?: number;
  halfCount?: number;
  hasExtraTime?: boolean;
  hasPenalty?: boolean;
  setsToWin?: number;
  pointsPerSet?: number;
  finalSetPoints?: number;
  maxPoints?: number;
}

const SPORT_DEFAULTS: Record<string, SportDefaults> = {
  football: {
    minPlayers: 11,
    maxPlayers: 25,
    matchDuration: 90,
    halfCount: 2,
    hasExtraTime: false,
    hasPenalty: false,
  },
  volleyball: {
    minPlayers: 6,
    maxPlayers: 14,
    setsToWin: 3,
    pointsPerSet: 25,
    finalSetPoints: 15,
  },
  badminton: {
    minPlayers: 1,
    maxPlayers: 2,
    setsToWin: 2,
    pointsPerSet: 21,
    maxPoints: 30,
  },
};

const tournamentSchema = z.object({
  name: z.string().min(3, 'Tên giải đấu phải có ít nhất 3 ký tự'),
  sport: z.enum(['football', 'volleyball', 'badminton']),
  format: z.enum([
    'round_robin',
    'single_elimination',
    'double_elimination',
    'group_stage_knockout',
  ]),
  description: z.string().optional(),
  minPlayersPerTeam: z.coerce.number().int().min(1),
  maxPlayersPerTeam: z.coerce.number().int().min(1),
  maxTeams: z.coerce.number().int().min(2).optional(),
  // Badminton-specific
  badmintonCategory: z.enum(['singles_men', 'singles_women', 'doubles_men', 'doubles_women', 'mixed_doubles']).optional(),
  // Volleyball-specific
  volleyballCategory: z.enum(['men', 'women', 'mixed', 'beach_men', 'beach_women', 'beach_mixed']).optional(),
  groupCount: z.coerce.number().int().min(2).optional(),
  teamsPerGroupAdvance: z.coerce.number().int().min(1).optional(),
  // Points system (round-robin / group stage only)
  pointsForWin: z.coerce.number().int().min(0).default(3),
  pointsForDraw: z.coerce.number().int().min(0).default(1),
  pointsForLoss: z.coerce.number().int().min(0).default(0),
  // Football-specific
  matchDuration: z.coerce.number().int().min(1).optional(),
  halfCount: z.coerce.number().int().min(1).max(4).optional(),
  hasExtraTime: z.boolean().optional(),
  hasPenalty: z.boolean().optional(),
  // Set-based sports (volleyball, badminton)
  setsToWin: z.coerce.number().int().min(1).optional(),
  pointsPerSet: z.coerce.number().int().min(1).optional(),
  finalSetPoints: z.coerce.number().int().min(1).optional(),
  maxPoints: z.coerce.number().int().min(1).optional(),
  // Schedule
  registrationStart: z.string().optional(),
  registrationEnd: z.string().optional(),
  startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  endDate: z.string().optional(),
  entryFee: z.coerce.number().int().min(0).default(0),
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

const STEPS = [
  { id: 'basic', label: 'Thông tin' },
  { id: 'rules', label: 'Thể lệ' },
  { id: 'schedule', label: 'Lịch trình' },
  { id: 'payment', label: 'Phí' },
  { id: 'review', label: 'Xác nhận' },
];

export function TournamentForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [createTournament, { loading }] = useMutation(CREATE_TOURNAMENT);

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: '',
      sport: 'football',
      format: 'single_elimination',
      description: '',
      minPlayersPerTeam: 11,
      maxPlayersPerTeam: 25,
      maxTeams: 16,
      groupCount: 4,
      teamsPerGroupAdvance: 2,
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      matchDuration: 90,
      halfCount: 2,
      hasExtraTime: false,
      hasPenalty: false,
      setsToWin: 3,
      pointsPerSet: 25,
      finalSetPoints: 15,
      maxPoints: 30,
      registrationStart: '',
      registrationEnd: '',
      startDate: '',
      endDate: '',
      entryFee: 0,
    },
  });

  const sport = form.watch('sport');
  const format = form.watch('format');

  function handleSportChange(value: string) {
    form.setValue('sport', value as TournamentFormValues['sport']);
    const defaults = SPORT_DEFAULTS[value];
    if (defaults) {
      form.setValue('minPlayersPerTeam', defaults.minPlayers);
      form.setValue('maxPlayersPerTeam', defaults.maxPlayers);
      // Football-specific
      form.setValue('matchDuration', defaults.matchDuration);
      form.setValue('halfCount', defaults.halfCount);
      form.setValue('hasExtraTime', defaults.hasExtraTime ?? false);
      form.setValue('hasPenalty', defaults.hasPenalty ?? false);
      // Set-based sports
      form.setValue('setsToWin', defaults.setsToWin);
      form.setValue('pointsPerSet', defaults.pointsPerSet);
      form.setValue('finalSetPoints', defaults.finalSetPoints);
      form.setValue('maxPoints', defaults.maxPoints);
    }
    // Sport-specific category defaults
    if (value === 'badminton') {
      form.setValue('badmintonCategory', 'singles_men');
      form.setValue('volleyballCategory', undefined);
      form.setValue('minPlayersPerTeam', 1);
      form.setValue('maxPlayersPerTeam', 1);
    } else if (value === 'volleyball') {
      form.setValue('volleyballCategory', 'men');
      form.setValue('badmintonCategory', undefined);
      form.setValue('minPlayersPerTeam', 6);
      form.setValue('maxPlayersPerTeam', 14);
    } else {
      form.setValue('badmintonCategory', undefined);
      form.setValue('volleyballCategory', undefined);
    }
  }

  function handleBadmintonCategoryChange(category: string) {
    form.setValue('badmintonCategory', category as TournamentFormValues['badmintonCategory']);
    const players = BADMINTON_PLAYERS[category];
    if (players) {
      form.setValue('minPlayersPerTeam', players.min);
      form.setValue('maxPlayersPerTeam', players.max);
    }
  }

  function handleVolleyballCategoryChange(category: string) {
    form.setValue('volleyballCategory', category as TournamentFormValues['volleyballCategory']);
    const cat = VOLLEYBALL_CATEGORIES.find(c => c.value === category);
    if (cat) {
      form.setValue('minPlayersPerTeam', cat.playersOnCourt);
      form.setValue('maxPlayersPerTeam', cat.maxRoster);
    }
  }

  async function handleNext() {
    let fieldsToValidate: (keyof TournamentFormValues)[] = [];

    switch (step) {
      case 0:
        fieldsToValidate = ['name', 'sport', 'format'];
        break;
      case 1:
        fieldsToValidate = ['minPlayersPerTeam', 'maxPlayersPerTeam'];
        break;
      case 2:
        fieldsToValidate = ['startDate'];
        break;
      case 3:
        fieldsToValidate = ['entryFee'];
        break;
    }

    const valid = await form.trigger(fieldsToValidate);
    if (valid) {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function onSubmit(values: TournamentFormValues) {
    try {
      // Only send fields that the API accepts (CreateTournamentInput)
      const input: Record<string, unknown> = {
        name: values.name,
        description: values.description || undefined,
        sport: values.sport,
        format: values.format,
        maxTeams: values.maxTeams,
        minPlayersPerTeam: values.minPlayersPerTeam,
        maxPlayersPerTeam: values.maxPlayersPerTeam,
        registrationStart: values.registrationStart || undefined,
        registrationEnd: values.registrationEnd || undefined,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        pointsForWin: values.pointsForWin,
        pointsForDraw: values.pointsForDraw,
        pointsForLoss: values.pointsForLoss,
        entryFee: values.entryFee,
        currency: 'VND',
      };

      // Group stage fields
      if (values.format === 'group_stage_knockout') {
        input.groupCount = values.groupCount;
        input.teamsPerGroupAdvance = values.teamsPerGroupAdvance;
      }

      // Store sport-specific rules in rulesText as JSON metadata
      const rules: Record<string, unknown> = {};
      if (values.sport === 'football') {
        rules.matchDuration = values.matchDuration;
        rules.halfCount = values.halfCount;
        rules.hasExtraTime = values.hasExtraTime;
        rules.hasPenalty = values.hasPenalty;
      }
      if (values.sport === 'volleyball') {
        rules.volleyballCategory = values.volleyballCategory;
        rules.setsToWin = values.setsToWin;
        rules.pointsPerSet = values.pointsPerSet;
        rules.finalSetPoints = values.finalSetPoints;
      }
      if (values.sport === 'badminton') {
        rules.badmintonCategory = values.badmintonCategory;
        rules.setsToWin = values.setsToWin;
        rules.pointsPerSet = values.pointsPerSet;
        rules.maxPoints = values.maxPoints;
      }
      if (Object.keys(rules).length > 0) {
        input.rulesText = JSON.stringify(rules);
      }

      const { data } = await createTournament({
        variables: { input },
      });

      if (data?.createTournament?.id) {
        toast.success('Tạo giải đấu thành công!');
        router.push(ROUTES.tournamentDetail(data.createTournament.id));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể tạo giải đấu';
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Tournament creation steps" className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                i < step &&
                  'bg-primary text-primary-foreground cursor-pointer',
                i === step && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                i > step && 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </button>
            <span
              className={cn(
                'hidden text-xs font-medium sm:inline',
                i === step ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-8',
                  i < step ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </nav>

      <Form {...form}>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (step === STEPS.length - 1) {
            form.handleSubmit(onSubmit)(e);
          }
        }}>
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[step].label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 0 && (
                <StepBasicInfo
                  form={form}
                  onSportChange={handleSportChange}
                />
              )}
              {step === 1 && (
                <StepRules
                  form={form}
                  sport={sport}
                  format={format}
                  onBadmintonCategoryChange={handleBadmintonCategoryChange}
                  onVolleyballCategoryChange={handleVolleyballCategoryChange}
                />
              )}
              {step === 2 && <StepSchedule form={form} />}
              {step === 3 && <StepPayment form={form} />}
              {step === 4 && <StepReview form={form} />}
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Tiếp theo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo giải đấu
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

function StepBasicInfo({
  form,
  onSportChange,
}: {
  form: ReturnType<typeof useForm<TournamentFormValues>>;
  onSportChange: (value: string) => void;
}) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tên giải đấu</FormLabel>
            <FormControl>
              <Input placeholder="VD: Giải bóng đá sinh viên 2026" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="sport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Môn thể thao</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  onSportChange(v);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="football">Bóng đá</SelectItem>
                  <SelectItem value="volleyball">Bóng chuyền</SelectItem>
                  <SelectItem value="badminton">Cầu lông</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="format"
          render={({ field }) => {
            const formats = FORMATS_BY_SPORT[form.watch('sport')] ?? FORMATS_BY_SPORT.football;
            // Reset format if current value not available for new sport
            if (!formats.find(f => f.value === field.value) && formats.length > 0) {
              field.onChange(formats[0].value);
            }
            return (
              <FormItem>
                <FormLabel>Thể thức giải đấu</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formats.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{formats.find(f => f.value === field.value)?.description}</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mô tả</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Mô tả về giải đấu..."
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function StepRules({
  form,
  sport,
  format,
  onBadmintonCategoryChange,
  onVolleyballCategoryChange,
}: {
  form: ReturnType<typeof useForm<TournamentFormValues>>;
  sport: string;
  format: string;
  onBadmintonCategoryChange: (category: string) => void;
  onVolleyballCategoryChange: (category: string) => void;
}) {
  const hasPointsSystem =
    format === 'round_robin' || format === 'group_stage_knockout';

  return (
    <>
      {/* -- Sport-specific info banner -- */}
      <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
        <p className="font-medium">
          {sport === 'football' && 'Thể lệ Bóng đá'}
          {sport === 'volleyball' && 'Thể lệ Bóng chuyền'}
          {sport === 'badminton' && 'Thể lệ Cầu lông'}
        </p>
        {sport === 'football' && (
          <p className="text-muted-foreground text-xs">
            Thi đấu theo hiệp, tính điểm đơn (sàn nhà - sân khách). Có thể bật hiệp phụ và loạt sút penalty.
          </p>
        )}
        {sport === 'volleyball' && (
          <p className="text-muted-foreground text-xs">
            Bóng chuyền thi đấu 6 người/đội (bãi biển 2 người). Mỗi set 25 điểm, set cuối 15 điểm. Cần dẫn 2 điểm để thắng set.
          </p>
        )}
        {sport === 'badminton' && (
          <p className="text-muted-foreground text-xs">
            Cầu lông thi đấu theo thể thức: Đơn (1v1) hoặc Đôi (2v2). Mỗi set 21 điểm, cần dẫn 2 điểm, tối đa 30 điểm/set.
          </p>
        )}
      </div>

      {/* -- Badminton: match category -- */}
      {sport === 'badminton' && (
        <FormField
          control={form.control}
          name="badmintonCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thể thức thi đấu</FormLabel>
              <Select
                value={field.value ?? 'singles_men'}
                onValueChange={(v) => {
                  field.onChange(v);
                  onBadmintonCategoryChange(v);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BADMINTON_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {(field.value ?? 'singles_men').startsWith('singles')
                  ? 'Đơn: 1 VĐV mỗi bên'
                  : 'Đôi: 2 VĐV mỗi bên'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* -- Volleyball: category (nam/nu/mixed/bai bien) -- */}
      {sport === 'volleyball' && (
        <FormField
          control={form.control}
          name="volleyballCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thể thức thi đấu</FormLabel>
              <Select
                value={field.value ?? 'men'}
                onValueChange={(v) => {
                  field.onChange(v);
                  onVolleyballCategoryChange(v);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VOLLEYBALL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {(field.value ?? 'men').startsWith('beach')
                  ? 'Bãi biển: 2 VĐV mỗi đội'
                  : 'Trong nhà: 6 VĐV thi đấu, tối đa 14 VĐV/đội (gồm dự bị)'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* -- Football: roster size (only football needs manual input) -- */}
      {sport === 'football' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="minPlayersPerTeam"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số VĐV tối thiểu / đội</FormLabel>
                <FormControl>
                  <Input type="number" min={5} max={11} {...field} />
                </FormControl>
                <FormDescription>Trên sân (5-11 người)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxPlayersPerTeam"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số VĐV tối đa / đội</FormLabel>
                <FormControl>
                  <Input type="number" min={11} max={30} {...field} />
                </FormControl>
                <FormDescription>Tổng đội hình (gồm dự bị)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="maxTeams"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Số đội tối đa</FormLabel>
            <FormControl>
              <Input type="number" min={2} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* -- Group stage config -- */}
      {format === 'group_stage_knockout' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="groupCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số bảng đấu</FormLabel>
                <FormControl>
                  <Input type="number" min={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="teamsPerGroupAdvance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số đội đi tiếp mỗi bảng</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <Separator />

      {/* -- Football-specific: match duration -- */}
      {sport === 'football' && (
        <>
          <h4 className="text-sm font-semibold">Thể thức trận đấu</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="matchDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thời lượng trận đấu (phút)</FormLabel>
                  <FormControl>
                    <Input type="number" min={10} {...field} />
                  </FormControl>
                  <FormDescription>Tổng thời gian thi đấu (VD: 90, 60, 40)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="halfCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số hiệp</FormLabel>
                  <Select
                    value={String(field.value ?? 2)}
                    onValueChange={(v) => field.onChange(parseInt(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2">2 hiệp</SelectItem>
                      <SelectItem value="4">4 hiệp</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="hasExtraTime"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-input"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="text-sm font-medium">Hiệp phụ</FormLabel>
                    <FormDescription className="text-xs">
                      Cho phép đá hiệp phụ trong vòng loại trực tiếp
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasPenalty"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-input"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="text-sm font-medium">Loạt sút penalty</FormLabel>
                    <FormDescription className="text-xs">
                      Cho phép sút penalty sau hiệp phụ
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </>
      )}

      {/* -- Volleyball-specific: sets config -- */}
      {sport === 'volleyball' && (
        <>
          <h4 className="text-sm font-semibold">Luật tính điểm</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="setsToWin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số set để thắng</FormLabel>
                  <Select
                    value={String(field.value ?? 3)}
                    onValueChange={(v) => field.onChange(parseInt(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2">Thắng 2/3 set</SelectItem>
                      <SelectItem value="3">Thắng 3/5 set</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pointsPerSet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm mỗi set</FormLabel>
                  <FormControl>
                    <Input type="number" min={15} max={30} {...field} />
                  </FormControl>
                  <FormDescription>Mặc định: 25</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finalSetPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm set cuối</FormLabel>
                  <FormControl>
                    <Input type="number" min={10} max={25} {...field} />
                  </FormControl>
                  <FormDescription>Mặc định: 15</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Cần dẫn 2 điểm để thắng set. Không giới hạn điểm tối đa.
          </p>
        </>
      )}

      {/* -- Badminton-specific: sets config -- */}
      {sport === 'badminton' && (
        <>
          <h4 className="text-sm font-semibold">Luật tính điểm</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="setsToWin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số set để thắng</FormLabel>
                  <Select
                    value={String(field.value ?? 2)}
                    onValueChange={(v) => field.onChange(parseInt(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Thắng 1 set</SelectItem>
                      <SelectItem value="2">Thắng 2/3 set</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pointsPerSet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm mỗi set</FormLabel>
                  <FormControl>
                    <Input type="number" min={11} max={30} {...field} />
                  </FormControl>
                  <FormDescription>Mặc định: 21</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Điểm mỗi set</FormLabel>
                  <FormControl>
                    <Input type="number" min={21} max={50} {...field} />
                  </FormControl>
                  <FormDescription>Mặc định: 30 (giới hạn khi deuce)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Cần dẫn 2 điểm. Khi 29-29, ai đạt 30 trước thắng.
          </p>
        </>
      )}

      {/* -- Points system (only for round-robin / group stage) -- */}
      {hasPointsSystem && (
        <>
          <Separator />
          <h4 className="text-sm font-semibold">Hệ thống tính điểm (Vòng tròn/Vòng bảng)</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="pointsForWin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thắng</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pointsForDraw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hòa</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pointsForLoss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thua</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </>
  );
}

function StepSchedule({
  form,
}: {
  form: ReturnType<typeof useForm<TournamentFormValues>>;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="registrationStart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mở đăng ký</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="registrationEnd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đóng đăng ký</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày bắt đầu giải</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày kết thúc giải</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

function StepPayment({
  form,
}: {
  form: ReturnType<typeof useForm<TournamentFormValues>>;
}) {
  return (
    <>
      <FormField
        control={form.control}
        name="entryFee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phí tham gia (VND)</FormLabel>
            <FormControl>
              <Input type="number" min={0} step={1000} {...field} />
            </FormControl>
            <FormDescription>
              Nhập 0 nếu miễn phí. Đơn vị: VND.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-lg border p-4 bg-muted/30">
        <p className="text-sm font-medium">Thông tin thanh toán</p>
        <p className="text-xs text-muted-foreground mt-1">
          Thanh toán qua MoMo, VNPay hoặc VietQR. Các đội sẽ
          được yêu cầu thanh toán sau khi đăng ký.
        </p>
      </div>
    </>
  );
}

function StepReview({
  form,
}: {
  form: ReturnType<typeof useForm<TournamentFormValues>>;
}) {
  const values = form.getValues();

  const allFormats = FORMATS_BY_SPORT[values.sport] ?? FORMATS_BY_SPORT.football;
  const sportLabels: Record<string, string> = { football: 'Bong da', volleyball: 'Bong chuyen', badminton: 'Cau long' };

  return (
    <div className="space-y-4">
      <ReviewSection title="Thông tin cơ bản">
        <ReviewItem label="Tên giải" value={values.name} />
        <ReviewItem label="Môn" value={sportLabels[values.sport] ?? values.sport} />
        <ReviewItem
          label="Thể thức giải"
          value={allFormats.find(f => f.value === values.format)?.label ?? values.format}
        />
        {values.description && (
          <ReviewItem label="Mô tả" value={values.description} />
        )}
      </ReviewSection>

      <Separator />

      <ReviewSection title="Thể lệ">
        {values.sport === 'badminton' ? (
          <ReviewItem
            label="Thể thức"
            value={BADMINTON_CATEGORIES.find(c => c.value === values.badmintonCategory)?.label ?? 'Đơn nam'}
          />
        ) : values.sport === 'volleyball' ? (
          <>
            <ReviewItem
              label="Thể thức"
              value={VOLLEYBALL_CATEGORIES.find(c => c.value === values.volleyballCategory)?.label ?? 'Bóng chuyền nam'}
            />
            <ReviewItem
              label="VĐV / đội"
              value={
                (values.volleyballCategory ?? 'men').startsWith('beach')
                  ? '2 người'
                  : `6 thi dau, toi da ${values.maxPlayersPerTeam} (gom du bi)`
              }
            />
          </>
        ) : (
          <ReviewItem
            label="VĐV / đội"
            value={`${values.minPlayersPerTeam} - ${values.maxPlayersPerTeam}`}
          />
        )}
        {values.maxTeams && (
          <ReviewItem label="Số đội tối đa" value={String(values.maxTeams)} />
        )}
        {values.format === 'group_stage_knockout' && (
          <>
            <ReviewItem
              label="Số bảng"
              value={String(values.groupCount ?? '-')}
            />
            <ReviewItem
              label="Đi tiếp mỗi bảng"
              value={String(values.teamsPerGroupAdvance ?? '-')}
            />
          </>
        )}
      </ReviewSection>

      <Separator />

      <ReviewSection title="Luật thi đấu">
        {values.sport === 'football' && (
          <>
            <ReviewItem label="Thời lượng" value={`${values.matchDuration ?? 90} phút`} />
            <ReviewItem label="Số hiệp" value={String(values.halfCount ?? 2)} />
            <ReviewItem label="Hiệp phụ" value={values.hasExtraTime ? 'Có' : 'Không'} />
            <ReviewItem label="Loạt sút penalty" value={values.hasPenalty ? 'Có' : 'Không'} />
          </>
        )}
        {values.sport === 'volleyball' && (
          <>
            <ReviewItem label="Thể thức" value={`Thắng ${(values.setsToWin ?? 3) * 2 - 1}`} />
            <ReviewItem label="Điểm mỗi set" value={String(values.pointsPerSet ?? 25)} />
            <ReviewItem label="Điểm set cuối" value={String(values.finalSetPoints ?? 15)} />
            <ReviewItem label="Cách biệt tối thiểu" value="2 points" />
          </>
        )}
        {values.sport === 'badminton' && (
          <>
            <ReviewItem label="Thể thức" value={`Thắng ${(values.setsToWin ?? 2) * 2 - 1}`} />
            <ReviewItem label="Điểm mỗi set" value={String(values.pointsPerSet ?? 21)} />
            <ReviewItem label="Điểm tối đa" value={String(values.maxPoints ?? 30)} />
            <ReviewItem label="Cách biệt tối thiểu" value="2 points" />
          </>
        )}
        {(values.format === 'round_robin' || values.format === 'group_stage_knockout') && (
          <ReviewItem
            label="Hệ thống điểm"
            value={`W:${values.pointsForWin} D:${values.pointsForDraw} L:${values.pointsForLoss}`}
          />
        )}
      </ReviewSection>

      <Separator />

      <ReviewSection title="Lịch trình">
        {values.registrationStart && (
          <ReviewItem
            label="Đăng ký"
            value={`${values.registrationStart} - ${values.registrationEnd ?? 'TBD'}`}
          />
        )}
        <ReviewItem label="Bắt đầu" value={values.startDate} />
        {values.endDate && <ReviewItem label="Kết thúc" value={values.endDate} />}
      </ReviewSection>

      <Separator />

      <ReviewSection title="Phí">
        <ReviewItem
          label="Phí tham gia"
          value={
            values.entryFee > 0 ? formatVND(values.entryFee) : 'Miễn phí'
          }
        />
        <ReviewItem label="Đơn vị" value="VND" />
      </ReviewSection>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
