'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeMockPaymentAction } from '@/lib/actions/bookings'
import { toast } from 'sonner'
import { Loader2, Smartphone, CheckCircle2 } from 'lucide-react'

export function CheckoutClient({
  bookingId,
  paymentStatus,
  status,
  ownerName,
  ownerPhoneMasked,
}: {
  bookingId: string
  paymentStatus: string
  status: string
  ownerName: string
  ownerPhoneMasked: string | null
}) {
  const alreadyPaid = paymentStatus === 'paid' || paymentStatus === 'held'

  const [pending, startTransition] = useTransition()
  const [phone, setPhone] = useState('+251911000000')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'form' | 'otp' | 'done'>(
    alreadyPaid ? 'done' : 'form'
  )
  const [transactionRef, setTransactionRef] = useState<string | null>(null)
  const router = useRouter()

  const payee = (
    <div className="rounded-md bg-muted p-3 text-sm">
      Paying to: <strong>{ownerName}</strong>
      {ownerPhoneMasked && (
        <span className="text-muted-foreground"> ({ownerPhoneMasked})</span>
      )}
    </div>
  )

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.match(/^\+?[0-9]{6,15}$/)) {
      toast.error('Enter a valid phone number')
      return
    }
    // Mock: pretend to send OTP and skip to the OTP step
    setOtp('')
    setStep('otp')
  }

  function onConfirmOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 4) {
      toast.error('Enter the 4-digit code (any 4 digits work in the demo)')
      return
    }
    startTransition(async () => {
      const res = await completeMockPaymentAction(bookingId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      setTransactionRef(res.transactionRef ?? null)
      setStep('done')
      toast.success('Payment completed')
      router.refresh()
    })
  }

  if (step === 'done' || alreadyPaid) {
    return (
      <Card className="mt-6 border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" /> Payment complete
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Your payment was received and is held until the trip is completed.</p>
          {transactionRef && (
            <p className="text-xs text-muted-foreground">
              Mock transaction reference:{' '}
              <code className="font-mono">{transactionRef}</code>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Status: <code className="capitalize">{status}</code>. The owner will
            confirm the booking next.
          </p>
          <Button asChild size="sm" className="mt-3">
            <a href={`/bookings/${bookingId}`}>View booking</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'otp') {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Enter OTP</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onConfirmOtp} className="space-y-3">
            {payee}
            <div>
              <Label htmlFor="otp">Demo OTP (any 4 digits)</Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={4}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                placeholder="1234"
              />
              <p className="text-xs text-muted-foreground mt-1">
                In this demo any 4-digit code works.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Confirm payment
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Smartphone className="h-4 w-4" /> TeleBirr mock
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          {payee}
          <div>
            <Label htmlFor="phone">Your TeleBirr phone number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251911000000"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            No real charge. No credentials stored. No SMS sent.
          </p>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Smartphone className="h-4 w-4 mr-1" />
            )}
            Send OTP (mock)
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}