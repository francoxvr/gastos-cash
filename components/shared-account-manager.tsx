"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useExpenses } from "@/context/expense-context"
import { useAuth } from "@/context/auth-context"
import { ArrowLeft, Copy, Check, Users, LogOut, UserMinus, Share2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SharedAccountManagerProps {
  onClose: () => void
}

export function SharedAccountManager({ onClose }: SharedAccountManagerProps) {
  const { user } = useAuth()
  const {
    isOwner, members, memberEmails, inviteCode, inviteEnabled,
    generateInviteCode, disableSharing, removeMember, joinHousehold, leaveHousehold,
  } = useExpenses()

  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [leaveConfirm, setLeaveConfirm] = useState(false)

  const handleCopy = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleJoin = async () => {
    setJoinError(null)
    setJoining(true)
    const result = await joinHousehold(joinCode)
    setJoining(false)
    if (!result.success) {
      setJoinError(result.error || "No se pudo unir a la cuenta")
    } else {
      setJoinCode("")
    }
  }

  const otherMembers = members.filter((uid) => uid !== user?.uid)

  return (
    <div className="flex min-h-screen flex-col bg-background animate-fade-in">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-2xl surface-card active-press"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-extrabold">Cuenta compartida</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-24">
        {!isOwner ? (
          <div className="flex flex-col gap-4 rounded-3xl surface-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold">Estás usando una cuenta compartida</span>
                <span className="text-xs text-muted-foreground">
                  Tus gastos, categorías y monedas son compartidos con los demás integrantes.
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setLeaveConfirm(true)}
              className="w-full h-12 rounded-2xl active-press"
            >
              <LogOut className="mr-2 h-4 w-4" /> Salir de la cuenta compartida
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 rounded-3xl surface-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Share2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Compartir tu cuenta</span>
                  <span className="text-xs text-muted-foreground">
                    Generá un código para que otra persona vea y registre los mismos gastos.
                  </span>
                </div>
              </div>

              {inviteEnabled && inviteCode ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted p-4">
                    <span className="flex-1 text-center text-2xl font-black tracking-[0.3em]">{inviteCode}</span>
                    <button
                      onClick={handleCopy}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground active-press"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button variant="outline" onClick={disableSharing} className="w-full h-11 rounded-2xl active-press">
                    Desactivar compartición
                  </Button>
                </div>
              ) : (
                <Button onClick={generateInviteCode} className="w-full h-12 rounded-2xl active-press">
                  Generar código de invitación
                </Button>
              )}
            </div>

            {otherMembers.length > 0 && (
              <div className="flex flex-col gap-2 rounded-3xl surface-card p-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Integrantes</h2>
                {otherMembers.map((uid) => (
                  <div key={uid} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 p-3">
                    <span className="text-sm font-medium truncate">{memberEmails[uid] || uid}</span>
                    <button
                      onClick={() => setRemoveTarget(uid)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive active-press"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-3xl surface-card p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unirse a una cuenta compartida</h2>
              <p className="text-xs text-muted-foreground">
                Ingresá el código que te compartieron para ver los mismos gastos que esa persona.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Código"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="h-12 flex-1 rounded-2xl text-center tracking-[0.3em] font-bold uppercase"
                  maxLength={6}
                />
                <Button onClick={handleJoin} disabled={!joinCode.trim() || joining} className="h-12 rounded-2xl active-press">
                  Unirse
                </Button>
              </div>
              {joinError && <p className="text-xs font-medium text-destructive">{joinError}</p>}
            </div>
          </>
        )}
      </div>

      {/* Confirmación de salida */}
      <AlertDialog open={leaveConfirm} onOpenChange={setLeaveConfirm}>
        <AlertDialogContent className="rounded-3xl w-[90%]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir de la cuenta compartida?</AlertDialogTitle>
            <AlertDialogDescription>
              Volverás a ver únicamente tus propios gastos, categorías y monedas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 mt-0 rounded-2xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={leaveHousehold} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl">
              Salir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de quitar integrante */}
      <AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent className="rounded-3xl w-[90%]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar integrante?</AlertDialogTitle>
            <AlertDialogDescription>
              "{removeTarget && (memberEmails[removeTarget] || removeTarget)}" dejará de ver los gastos compartidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 mt-0 rounded-2xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (removeTarget) removeMember(removeTarget); setRemoveTarget(null) }}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl"
            >
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
