'use client';

import { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { Tag, Loader2, Check, X } from 'lucide-react';

import { formatVND } from '@/lib/utils/format';
import { VALIDATE_PROMO_CODE } from '@/graphql/queries/payment';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PromoCodeInputProps {
  tournamentId: string;
  amount: number;
  onValidated: (discountAmount: number, code: string) => void;
}

export function PromoCodeInput({
  tournamentId,
  amount,
  onValidated,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{
    valid: boolean;
    discountAmount: number;
    message: string;
  } | null>(null);

  const [validate, { loading }] = useLazyQuery(VALIDATE_PROMO_CODE, {
    onCompleted: (data) => {
      const res = data.validatePromoCode;
      setResult(res);
      if (res.valid) {
        onValidated(res.discountAmount, code);
      }
    },
  });

  function handleApply() {
    if (!code.trim()) return;
    setResult(null);
    validate({
      variables: { tournamentId, code: code.trim(), amount },
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setResult(null);
            }}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleApply}
          disabled={loading || !code.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {result && (
        <div
          className={`flex items-center gap-2 text-xs ${
            result.valid ? 'text-green-600' : 'text-destructive'
          }`}
        >
          {result.valid ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          <span>
            {result.valid
              ? `Discount: ${formatVND(result.discountAmount)}`
              : result.message}
          </span>
        </div>
      )}
    </div>
  );
}
