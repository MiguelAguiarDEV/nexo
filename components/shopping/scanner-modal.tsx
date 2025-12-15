"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Camera, Check, Loader2, X } from "lucide-react";
import { useState, useRef } from "react";
import { scanReceipt, type ReceiptData, confirmScanResults } from "@/app/(dashboard)/shopping/actions/scan";
import Image from "next/image";

export function ScannerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("CLIENT: No file selected");
      return;
    }

    console.log("CLIENT: File selected:", file.name, "Size:", file.size, "Type:", file.type);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        console.log("CLIENT: Image preview generated");
        setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsScanning(true);
    setResult(null);

    // Create FormData with a distinct name to avoid conflicts
    const uploadData = new FormData();
    uploadData.append("image", file);
    console.log("CLIENT: Prepared FormData, sending to server...");

    try {
      console.log("CLIENT: Calling scanReceipt server action...");
      const response = await scanReceipt(uploadData);
      console.log("CLIENT: Response received from server:", response);

      if (response.success && response.data) {
        console.log("CLIENT: Scan success! Data:", response.data);
        setResult(response.data);
      } else {
        // Handle error
        console.error("CLIENT: Scan failed. Error:", response.error);
        if (response.error?.includes("Google API Key")) {
           alert("Falta la API Key de Google. Revisa la consola o reinicia el servidor.");
        } else {
           alert("Error al escanear el ticket: " + (response.error || "Desconocido"));
        }
        setIsOpen(false);
      }
    } catch (error) {
      console.error("CLIENT: Unexpected error calling server action:", error);
      alert("Error de conexión o inesperado. Intenta de nuevo.");
      setIsOpen(false);
    } finally {
      setIsScanning(false);
      console.log("CLIENT: Scanning process finished (finally block)");
    }
  };

  const handleConfirm = async () => {
    if (!result) return;
    
    try {
      await confirmScanResults(result);
      setIsOpen(false);
      setImagePreview(null);
      setResult(null);
      // Optional: Show success message
    } catch (error) {
      console.error(error);
      alert("Error al guardar los datos");
    }
  };

  const handleRetake = () => {
    setImagePreview(null);
    setResult(null);
    fileInputRef.current?.click();
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-10 w-10 rounded-full shadow-md bg-background border hover:bg-accent"
        >
          <Camera className="h-5 w-5" />
          <span className="sr-only">Escanear Ticket</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-sm flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Escanear Ticket</DrawerTitle>
            <DrawerDescription>
              Sube una foto de tu ticket de compra para procesarlo automáticamente.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center space-y-3">
            {!imagePreview ? (
              <div className="w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/50 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Toca para tomar foto</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="space-y-3 w-full">
                <div className="relative w-full h-32 rounded-lg overflow-hidden">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <span className="text-sm font-medium">Analizando con IA...</span>
                      </div>
                    </div>
                  )}
                </div>

                {result && (
                  <div className="bg-card border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div>
                        <h3 className="font-semibold">{result.store}</h3>
                        <p className="text-xs text-muted-foreground">{result.date}</p>
                      </div>
                      <span className="text-xl font-bold">{result.total.toFixed(2)}€</span>
                    </div>
                    
                    <div className="max-h-24 overflow-y-auto space-y-1 text-sm">
                      {result.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">{item.price.toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DrawerFooter className="flex-shrink-0 border-t pt-3 pb-4 space-y-2">
            {result ? (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={handleRetake} className="flex-1 h-10">
                  Repetir
                </Button>
                <Button onClick={handleConfirm} className="flex-1 h-10">
                  <Check className="mr-1.5 h-4 w-4" /> Confirmar
                </Button>
              </div>
            ) : (
              !isScanning && imagePreview && (
                <Button onClick={handleRetake} variant="outline" className="w-full h-10">
                   Intentar de nuevo
                </Button>
              )
            )}
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full h-9">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
