import { Button } from "antd";
import { PlusOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useVerificationStore } from "../store/verificationStore";

interface VerifyStartProps {
  onSelectGovernmentID?: () => void;
  onSelectLiveness?: () => void;
}

function VerifyStart({
  onSelectGovernmentID,
  onSelectLiveness,
}: VerifyStartProps) {
  const { isGovernmentIDComplete, isLivenessComplete } = useVerificationStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-4xl">Verify identity</h1>
      </div>

      <div className="flex-1 px-6 space-y-6">
        <div className="bg-zinc-900 rounded-3xl p-8">
          <h2 className="text-2xl mb-3">Government ID</h2>
          <p className="text-sm text-gray-400 mb-8">
            Take a national identity photo
          </p>

          {isGovernmentIDComplete ? (
            <div className="flex items-center gap-3">
              <CheckCircleOutlined className="text-green-500 text-2xl" />
              <span className="text-green-500 text-lg font-medium">
                Completed
              </span>
            </div>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="bg-blue-900 hover:bg-blue-800 border-none rounded-full h-12 px-8"
              onClick={onSelectGovernmentID}
            >
              Select
            </Button>
          )}
        </div>

        <div className="bg-zinc-900 rounded-3xl p-8">
          <h2 className="text-2xl mb-3">Liveness Check</h2>
          <p className="text-sm text-gray-400 mb-8">
            It's required by law to verify your identity as a new user
          </p>

          {isLivenessComplete ? (
            <div className="flex items-center gap-3">
              <CheckCircleOutlined className="text-green-500 text-2xl" />
              <span className="text-green-500 text-lg font-medium">
                Completed
              </span>
            </div>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="bg-blue-900 hover:bg-blue-800 border-none rounded-full h-12 px-8"
              onClick={onSelectLiveness}
            >
              Select
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyStart;
