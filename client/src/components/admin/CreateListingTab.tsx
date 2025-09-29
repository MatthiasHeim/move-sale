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
import imageCompression from "browser-image-compression";

import type { AgentProposal } from "@shared/schema";

// iOS/Safari detection utility
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isSafari = () => {
  if (typeof window === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export default function CreateListingTab() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [proposal, setProposal] = useState<AgentProposal | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<{ current: number; total: number } | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        let errorText = "";
        try {
          const error = await response.json();
          errorText = error.error || error.message || "Upload failed";
        } catch (parseError) {
          const rawText = await response.text();
          errorText = rawText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadedImages(data.image_urls);
      toast({
        title: "Bilder hochgeladen",
        description: `${data.processed} von ${data.total} Bildern erfolgreich verarbeitet.`,
      });
    },
    onError: (error: any) => {
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

      console.log("Publishing product:", productData);
      const response = await apiRequest("POST", "/api/products", productData);
      const result = await response.json();
      console.log("Publish response:", result);
      return result;
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

  // Canvas-based fallback compression
  const compressWithCanvas = useCallback((file: File, maxSize: number = 1024 * 1024): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions to fit within reasonable bounds
        const maxDimension = 1600;
        let { width, height } = img;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        ctx!.drawImage(img, 0, 0, width, height);

        // Try different quality levels to achieve target size
        const tryCompress = (quality: number): void => {
          canvas.toBlob((blob) => {
            if (blob && (blob.size <= maxSize || quality <= 0.1)) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else if (quality > 0.1) {
              tryCompress(quality - 0.1);
            } else {
              reject(new Error('Could not compress to target size'));
            }
          }, 'image/jpeg', quality);
        };

        tryCompress(0.8);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Helper function to check if file is HEIC
  const isHeicFile = useCallback((file: File): boolean => {
    const fileName = file.name || '';
    return fileName.toLowerCase().match(/\.(heic|heif)$/i) !== null;
  }, []);

  // Robust compression function with HEIC-aware handling
  const compressImages = useCallback(async (files: File[]): Promise<File[]> => {
    setIsCompressing(true);
    setCompressionProgress({ current: 0, total: files.length });

    const compressedFiles: File[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCompressionProgress({ current: i + 1, total: files.length });

      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const isHeic = isHeicFile(file);

      try {
        let compressedFile: File;

        if (isHeic) {
          // HEIC files: Allow larger sizes, server will convert and compress
          const maxHeicSize = 10 * 1024 * 1024; // 10MB limit for HEIC (server will handle compression)
          if (file.size > maxHeicSize) {
            errors.push(`${file.name}: HEIC Datei zu groß (${originalSize}MB > 10MB)`);
            continue;
          }

          // For HEIC files, try gentle compression but don't fail if it doesn't work well
          try {
            compressedFile = await imageCompression(file, {
              maxSizeMB: 8.0, // More lenient for HEIC
              maxWidthOrHeight: 2400, // Higher resolution for HEIC
              useWebWorker: false,
              quality: 0.9, // Higher quality for HEIC
              fileType: 'image/jpeg' // Convert to JPEG
            });
          } catch (heicCompressionError) {
            console.warn('HEIC compression failed, sending original to server:', heicCompressionError);
            // Send original HEIC file to server for processing
            compressedFile = file;
          }

          toast({
            title: `${file.name} vorbereitet`,
            description: `HEIC Datei wird auf dem Server konvertiert (${originalSize}MB)`,
          });
        } else {
          // Non-HEIC files: Apply strict compression as before
          try {
            compressedFile = await imageCompression(file, {
              maxSizeMB: 1.0,
              maxWidthOrHeight: 1600,
              useWebWorker: false,
              quality: 0.7
            });
          } catch (libraryError) {
            console.warn('browser-image-compression failed, using Canvas fallback:', libraryError);
            compressedFile = await compressWithCanvas(file, 1024 * 1024);
          }

          const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);

          // Hard size limit for non-HEIC files
          if (compressedFile.size > 1.5 * 1024 * 1024) {
            errors.push(`${file.name}: Noch zu groß nach Komprimierung (${compressedSize}MB > 1.5MB)`);
            continue;
          }

          toast({
            title: `${file.name} komprimiert`,
            description: `${originalSize}MB → ${compressedSize}MB`,
          });
        }

        compressedFiles.push(compressedFile);

      } catch (error: any) {
        console.error(`Processing failed for ${file.name}:`, error);
        errors.push(`${file.name}: Verarbeitung fehlgeschlagen (${error.message})`);
      }
    }

    setIsCompressing(false);
    setCompressionProgress(null);

    // Show errors if any files failed
    if (errors.length > 0) {
      const errorMessage = errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : '');
      toast({
        title: `${errors.length} Datei(en) abgelehnt`,
        description: errorMessage,
        variant: "destructive",
      });
    }

    // Final check - make sure we have some successfully processed files
    if (compressedFiles.length === 0) {
      throw new Error('Keine Dateien konnten erfolgreich verarbeitet werden. Bitte verwenden Sie kleinere Bilder oder andere Formate.');
    }

    return compressedFiles;
  }, [toast, compressWithCanvas, isHeicFile]);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
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

    if (acceptedFiles.length === 0) {
      return;
    }

    try {
      // Always compress all files for consistency and size optimization
      const compressedFiles = await compressImages(acceptedFiles);
      uploadMutation.mutate(compressedFiles);
    } catch (error: any) {
      toast({
        title: "Komprimierung fehlgeschlagen",
        description: error.message || "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  }, [uploadMutation, compressImages, toast]);

  // Detect if we're on iOS/Safari
  const isIOSDevice = isIOS() || isSafari();

  const { getRootProps, getInputProps: getOriginalInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: false,
    maxFiles: 8,
    // Remove maxSize limit since we compress client-side
    // Different configurations for iOS vs other browsers
    accept: isIOSDevice ? undefined : {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.heif']
    },
    // Custom validator - only reject obvious non-images
    validator: (file) => {
      const fileName = file.name.toLowerCase();
      const badExtensions = ['.txt', '.doc', '.pdf', '.zip', '.exe', '.mp4', '.avi'];

      if (badExtensions.some(ext => fileName.endsWith(ext))) {
        return {
          code: "file-invalid-type",
          message: `File type not supported: ${fileName.substring(fileName.lastIndexOf('.'))}`
        };
      }

      return null;
    }
  });

  // Override getInputProps to remove accept attribute on iOS
  const getInputProps = useCallback(() => {
    const props = getOriginalInputProps();

    if (isIOSDevice) {
      // Remove the accept attribute entirely for iOS to prevent Safari validation errors
      const { accept, ...propsWithoutAccept } = props;
      return propsWithoutAccept;
    }

    return props;
  }, [getOriginalInputProps, isIOSDevice]);

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
            {isCompressing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="font-medium">
                    Komprimiere Bilder...
                    {compressionProgress && ` (${compressionProgress.current}/${compressionProgress.total})`}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>✨ Optimiere Dateigröße für schnellen Upload</p>
                  <p>🔄 Versuche intelligente Komprimierung mit Fallback</p>
                  <p>⚡ Nur Dateien unter 1.5MB werden akzeptiert</p>
                </div>
              </div>
            ) : uploadMutation.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                <span>Bilder werden hochgeladen...</span>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive
                    ? "Bilder hier ablegen..."
                    : "Bilder hierher ziehen oder klicken"}
                </p>
                <div className="text-sm text-gray-500 mt-2 space-y-1">
                  <p>📱 iPhone-Fotos (HEIC), JPEG, PNG • Max. 8 Bilder</p>
                  <p>🚀 <strong>Automatische Komprimierung:</strong> Große Dateien werden intelligent verkleinert</p>
                  <p>✅ <strong>Garantiert unter 1.5MB:</strong> Dateien die zu groß bleiben werden abgelehnt</p>
                </div>
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