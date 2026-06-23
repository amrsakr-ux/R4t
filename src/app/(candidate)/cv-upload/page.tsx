"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, Loader2, X } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

function CVUploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("candidateId") || "";
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      } else {
        toast({ title: "Invalid file", description: "Only PDF and DOCX files are allowed", variant: "destructive" });
      }
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("cv", file);

      const res = await fetch(`/api/candidates/${candidateId}/cv`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploaded(true);
        toast({ title: "CV uploaded successfully!" });
        setTimeout(() => router.push("/status"), 2000);
      } else {
        const err = await res.json();
        toast({ title: "Upload failed", description: err.error, variant: "destructive" });
      }
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="max-w-xl mx-auto text-center">
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardContent className="pt-10 pb-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
            <p className="text-blue-200 mb-2">Your CV has been uploaded and is being processed.</p>
            <p className="text-blue-300 text-sm">Our AI will analyze your profile and match you to opportunities. Redirecting to your status page...</p>
            <Loader2 className="w-5 h-5 animate-spin text-blue-400 mx-auto mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Your CV</h2>
        <p className="text-blue-200">The final step — let us learn more about your professional background.</p>
      </div>

      <Card className="bg-white/10 backdrop-blur border-white/20">
        <CardContent className="pt-6 space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-blue-400 bg-blue-500/10" : "border-white/30 hover:border-blue-400 hover:bg-white/5"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-1">
                {isDragActive ? "Drop your CV here..." : "Drag & drop your CV here"}
              </p>
              <p className="text-blue-300 text-sm">or click to browse</p>
              <p className="text-blue-400 text-xs mt-3">Supports PDF and DOCX • Max 10MB</p>
            </div>
          ) : (
            <div className="border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-blue-300 text-sm">{formatFileSize(file.size)}</p>
                </div>
                <button onClick={() => setFile(null)} className="text-blue-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
            size="lg"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />Upload CV & Complete Application</>
            )}
          </Button>

          <p className="text-blue-400 text-xs text-center">
            Your CV will be securely stored and analyzed by our AI to match you with the best opportunities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CVUploadPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <CVUploadForm />
    </Suspense>
  );
}
