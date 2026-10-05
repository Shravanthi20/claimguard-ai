import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { ClaimForm } from "../../components/ClaimForm";
import { claimService, CreateClaimPayload } from "../../services/claimService";

export const CustomerNewClaim: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (payload: CreateClaimPayload) => {
    setLoading(true);
    try {
      const res = await claimService.createClaim(payload);
      navigate(`/customer/claims/${res.claim.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="File an Insurance Claim"
      subtitle="Complete the form below and upload supporting photos or receipts to submit your claim."
    >
      <ClaimForm onSubmit={handleFormSubmit} loading={loading} />
    </DashboardLayout>
  );
};
