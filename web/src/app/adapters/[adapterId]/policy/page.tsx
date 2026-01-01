"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PolicyBasicsForm } from "../../../../components/PolicyBasicsForm";
import { AdvancedConditionsForm } from "../../../../components/AdvancedConditionsForm";
import { PolicyPreview } from "../../../../components/PolicyPreview";
import { useCompiler } from "../../../../hooks/useCompiler";
import { useTemplates } from "../../../../hooks/useTemplates";
import { useWallet } from "../../../../hooks/useWallet";
import { createEmptyPolicy, type PolicyFormState, type PolicyTemplate } from "../../../../types/policy";

// Adapter info mapping
const ADAPTER_INFO: Record<string, { name: string; icon: string; description: string }> = {
  "transfer-bot": {
    name: "Transfer Bot",
    icon: "💸",
    description: "Automate token transfers on a schedule",
  },
  "swap-bot": {
    name: "Swap Bot",
    icon: "🔄",
    description: "Automated token swaps",
  },
  "dca-bot": {
    name: "DCA Bot",
    icon: "📈",
    description: "Dollar-cost averaging",
  },
};

export default function AdapterPolicyBuilder() {
  const router = useRouter();
  const params = useParams();
  const adapterId = params.adapterId as string;
  const adapterInfo = ADAPTER_INFO[adapterId] || { name: adapterId, icon: "🤖", description: "Automation adapter" };

  const { address, isConnected } = useWallet();
  const [policyDoc, setPolicyDoc] = useState<PolicyFormState>(createEmptyPolicy());
  const [showTemplates, setShowTemplates] = useState(false);

  const { compiled, loading, error } = useCompiler(policyDoc);
  const { templates, loading: templatesLoading } = useTemplates();

  // Set default policy name based on adapter
  useEffect(() => {
    if (!policyDoc.name || policyDoc.name === "") {
      setPolicyDoc(prev => ({
        ...prev,
        name: `${adapterInfo.name} Policy`,
      }));
    }
  }, [adapterId, adapterInfo.name]);

  const handleTemplateSelect = (template: PolicyTemplate) => {
    setPolicyDoc(template.policy as PolicyFormState);
    setShowTemplates(false);
  };

  const handleContinue = () => {
    if (compiled?.valid) {
      // Store both the compiled policy and adapter ID
      localStorage.setItem("compiledPolicy", JSON.stringify({ ...compiled, adapterId }));
      // Redirect to dashboard for permission grant
      router.push("/dashboard");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-zinc-400 mb-6">Please connect your wallet to build a policy</p>
          <button
            onClick={() => router.push("/adapters")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Back to Adapters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Breadcrumb and Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/adapters")}
            className="text-zinc-400 hover:text-white mb-6 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Adapters
          </button>

          {/* Adapter Info Banner */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{adapterInfo.icon}</div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold">{adapterInfo.name}</h1>
                  <span className="px-2 py-1 text-xs bg-blue-600 rounded">Policy Builder</span>
                </div>
                <p className="text-zinc-400">{adapterInfo.description}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">Configure Policy</h2>
            <p className="text-zinc-400">
              Define spending limits and safety conditions for your {adapterInfo.name.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Template Selector */}
        <div className="mb-8">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div className="text-left">
                <div className="font-medium">Start with a Template</div>
                <div className="text-sm text-zinc-400">
                  Choose from pre-built policies or customize from scratch
                </div>
              </div>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${showTemplates ? "rotate-180" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showTemplates && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {templatesLoading ? (
                <div className="col-span-2 text-center py-8 text-zinc-400">
                  Loading templates...
                </div>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-blue-600 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon || "📄"}</span>
                      <div className="flex-1">
                        <div className="font-medium mb-1 group-hover:text-blue-400 transition-colors">
                          {template.name}
                        </div>
                        <div className="text-sm text-zinc-400 line-clamp-2">{template.description}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Policy Builder Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">Basic Settings</h3>
              <PolicyBasicsForm value={policyDoc} onChange={setPolicyDoc} />
            </div>

            {/* Advanced Conditions */}
            <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Advanced Conditions</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Add optional safety conditions to restrict when and how transfers can occur
              </p>
              <AdvancedConditionsForm value={policyDoc} onChange={setPolicyDoc} />
            </div>
          </div>

          {/* Right: Preview */}
          <div>
            <div className="lg:sticky lg:top-24">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <PolicyPreview
                compiled={compiled}
                policyDocument={policyDoc}
                loading={loading}
                error={error}
                onPolicyChange={(policy) => setPolicyDoc(policy as PolicyFormState)}
              />

              {compiled?.valid && (
                <button
                  onClick={handleContinue}
                  className="w-full mt-6 px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Permission Grant
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
