import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Loader2, Sparkles, Copy, CheckCircle, Edit3 } from "lucide-react";
import type { AgentProposal } from "@shared/schema";

export default function CreateListingTab() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [proposal, setProposal] = useState<AgentProposal | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      console.log("📤 Upload mutation started");
      console.log("📋 Files to upload:", files.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        lastModified: f.lastModified
      })));

      const formData = new FormData();
      files.forEach((file, index) => {
        console.log(`📎 Appending file ${index + 1}:`, file.name, file.type);
        formData.append("images", file);
      });

      console.log("🌐 Sending request to /api/upload");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      console.log("📥 Response received:", response.status, response.statusText);

      if (!response.ok) {
        let errorText = "";
        try {
          const error = await response.json();
          errorText = error.error || error.message || "Upload failed";
          console.error("❌ Server error:", error);
        } catch (parseError) {
          const rawText = await response.text();
          errorText = rawText || `HTTP ${response.status}: ${response.statusText}`;
          console.error("❌ Failed to parse error response:", rawText);
        }
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log("✅ Upload successful:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 Upload mutation success:", data);
      setUploadedImages(data.image_urls);
      toast({
        title: "Bilder hochgeladen",
        description: `${data.processed} von ${data.total} Bildern erfolgreich verarbeitet.`,
      });
    },
    onError: (error: any) => {
      console.error("💥 Upload mutation error:", error);
      toast({
        title: "Upload fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async ({ text, image_urls }: { text: string; image_urls: string[] }) => {
      const response = await apiRequest("POST", "/api/agent/draft", { text, image_urls });
      return response.json();
    },
    onSuccess: (data) => {
      setProposal(data.proposal);
      toast({
        title: "Vorschlag generiert",
        description: "KI hat einen Produktvorschlag erstellt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (proposal: AgentProposal) => {
      const productData = {
        name: proposal.name,
        description: proposal.description,
        price: proposal.price_chf,
        category: proposal.category,
        imageUrls: proposal.gallery_image_urls,
      };
      
      const response = await apiRequest("POST", "/api/products", productData);
      return response.json();
    },
    onSuccess: () => {
      // Reset form
      setUploadedImages([]);
      setUserInput("");
      setProposal(null);
      
      toast({
        title: "Artikel veröffentlicht",
        description: "Der Artikel wurde erfolgreich erstellt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Veröffentlichung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    console.log("📁 onDrop called");
    console.log("✅ Accepted files:", acceptedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
    console.log("❌ Rejected files:", rejectedFiles.map(f => ({
      file: { name: f.file?.name, type: f.file?.type, size: f.file?.size },
      errors: f.errors?.map((e: any) => ({ code: e.code, message: e.message }))
    })));

    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(f =>
        f.errors?.map((e: any) => `${f.file?.name}: ${e.message}`).join(", ")
      ).join("; ");

      toast({
        title: "Dateien abgelehnt",
        description: errorMessages,
        variant: "destructive",
      });
      return;
    }

    if (acceptedFiles.length > 8) {
      toast({
        title: "Zu viele Dateien",
        description: "Maximal 8 Bilder erlaubt.",
        variant: "destructive",
      });
      return;
    }

    console.log("🚀 Starting upload for files:", acceptedFiles.map(f => f.name));
    uploadMutation.mutate(acceptedFiles);
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Remove accept validation entirely - let the server handle it
    noClick: false,
    noKeyboard: false,
    maxFiles: 8,
    maxSize: 10 * 1024 * 1024, // 10MB
    // Remove all file type restrictions to bypass react-dropzone issues
    accept: undefined,
    // Custom validator that's very permissive
    validator: (file) => {
      console.log("🔍 Permissive validator for file:", {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Only reject obviously non-image files
      const fileName = file.name.toLowerCase();
      const badExtensions = ['.txt', '.doc', '.pdf', '.zip', '.exe'];

      if (badExtensions.some(ext => fileName.endsWith(ext))) {
        console.log("❌ File rejected - clearly not an image:", file.name);
        return {
          code: "file-invalid-type",
          message: `File type not supported: ${fileName.substring(fileName.lastIndexOf('.'))}`
        };
      }

      console.log("✅ File accepted by permissive validator:", file.name);
      return null; // Accept everything else
    }
  });

  const handleGenerate = () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Keine Bilder",
        description: "Bitte laden Sie zuerst Bilder hoch.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({
      text: userInput,
      image_urls: uploadedImages,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopiert",
      description: `${label} wurde in die Zwischenablage kopiert.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            1. Bilder hochladen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            data-testid="dropzone-upload"
          >
            <input {...getInputProps()} />
            {uploadMutation.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Bilder werden verarbeitet...</span>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive
                    ? "Bilder hier ablegen..."
                    : "Bilder hierher ziehen oder klicken"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  iPhone-Fotos (HEIC), JPEG, PNG • Max. 8 Bilder • Max. 10MB pro Bild
                </p>
              </div>
            )}
          </div>
          
          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Hochgeladene Bilder ({uploadedImages.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {uploadedImages.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                    data-testid={`image-preview-${index}`}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>2. Zusätzliche Informationen (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Z.B. Marke, Besonderheiten, Zustand, Abmessungen..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="min-h-[100px]"
            data-testid="textarea-input"
          />
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={uploadedImages.length === 0 || generateMutation.isPending}
          size="lg"
          className="flex items-center gap-2"
          data-testid="button-generate"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              KI analysiert...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Mit KI generieren
            </>
          )}
        </Button>
      </div>

      {/* Proposal Section */}
      {proposal && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              3. Generierter Vorschlag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Preview */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img
                  src={proposal.cover_image_url}
                  alt={proposal.name}
                  className="w-full h-64 object-cover rounded-lg"
                  data-testid="proposal-cover-image"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold" data-testid="proposal-name">
                    {proposal.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" data-testid="proposal-category">
                      {proposal.category}
                    </Badge>
                    <Badge variant="outline" data-testid="proposal-condition">
                      {proposal.condition}
                    </Badge>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600" data-testid="proposal-price">
                  CHF {proposal.price_chf}
                </div>
                <p className="text-gray-700" data-testid="proposal-description">
                  {proposal.description}
                </p>
                {proposal.dimensions_cm && (
                  <p className="text-sm text-gray-500" data-testid="proposal-dimensions">
                    Abmessungen: {proposal.dimensions_cm}
                  </p>
                )}
              </div>
            </div>

            {/* Market Research Section */}
            {(proposal.market_research || proposal.price_confidence) && (
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span>📊 Marktforschung</span>
                  {proposal.price_confidence && (
                    <Badge
                      variant={
                        proposal.price_confidence === "hoch" ? "default" :
                        proposal.price_confidence === "mittel" ? "secondary" :
                        "outline"
                      }
                      data-testid="price-confidence"
                    >
                      Konfidenz: {proposal.price_confidence}
                    </Badge>
                  )}
                </h4>
                {proposal.market_research && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-800" data-testid="market-research">
                      {proposal.market_research}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tutti Text Preview */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3">Tutti-Text:</h4>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Titel:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(proposal.tutti_title_de, "Titel")}
                      data-testid="button-copy-title"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="font-medium" data-testid="tutti-title">
                    {proposal.tutti_title_de}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Beschreibung:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(proposal.tutti_body_de, "Beschreibung")}
                      data-testid="button-copy-description"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap" data-testid="tutti-body">
                    {proposal.tutti_body_de}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleGenerate}
                variant="outline"
                disabled={generateMutation.isPending}
                data-testid="button-regenerate"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Neu generieren
              </Button>
              <Button
                onClick={() => publishMutation.mutate(proposal)}
                disabled={publishMutation.isPending}
                data-testid="button-publish"
              >
                {publishMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Veröffentliche...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Veröffentlichen
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}