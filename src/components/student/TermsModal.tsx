import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
import { acceptStudentTerms } from "../../api/auth";
import { setCachedUser } from "../../lib/session";
import type { StudentUser } from "../../api/types";
import { toast } from "sonner";

interface TermsModalProps {
  user: StudentUser | null;
  setUser: (user: StudentUser) => void;
}

export function TermsModal({ user, setUser }: TermsModalProps) {
  const [loading, setLoading] = useState(false);
  const open = user !== null && user.termsAcceptedAt === null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      const updated = await acceptStudentTerms();
      setCachedUser("STUDENT", updated);
      setUser(updated);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-8 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="terms-description"
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#610981] to-[#8b0fa8] shadow-lg">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>

            <DialogPrimitive.Title className="text-xl font-semibold text-gray-900">
              Terms &amp; Conditions
            </DialogPrimitive.Title>

            <p id="terms-description" className="text-sm text-muted-foreground leading-relaxed">
              Before you continue, please review and accept our{" "}
              <a
                href="https://www.navyogawellness.com/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#610981] underline hover:text-[#8b0fa8]"
              >
                Terms and Conditions
              </a>
              ,{" "}
              <a
                href="https://www.navyogawellness.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#610981] underline hover:text-[#8b0fa8]"
              >
                Privacy Policy
              </a>
              {" "}and{" "}
              <a
                href="https://www.navyogawellness.com/refund-cancellation-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#610981] underline hover:text-[#8b0fa8]"
              >
                Refund &amp; Cancellation Policy
              </a>
              . By clicking <strong>Accept</strong>, you agree to our policies governing
              your use of the NavYoga platform.
            </p>

            <Button
              className="mt-2 w-full bg-[#610981] hover:bg-[#8b0fa8] text-white font-semibold py-3 text-base rounded-xl shadow-md transition-all"
              onClick={handleAccept}
              disabled={loading}
            >
              {loading ? "Saving…" : "I Accept"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
