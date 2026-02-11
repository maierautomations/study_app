"use client";

import { useState } from "react";
import { OnboardingWizard } from "./onboarding-wizard";

export function OnboardingCheck({
  onboardingCompleted,
}: {
  onboardingCompleted: boolean;
}) {
  const [showWizard, setShowWizard] = useState(!onboardingCompleted);

  if (!showWizard) return null;

  return (
    <OnboardingWizard
      open={showWizard}
      onComplete={() => setShowWizard(false)}
    />
  );
}
