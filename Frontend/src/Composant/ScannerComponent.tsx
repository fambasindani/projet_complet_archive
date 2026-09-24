// @ts-nocheck
import React, { useEffect, useState } from "react";
import Dynamsoft from "dwt";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function ScannerComponent() {
  const [DWObject, setDWObject] = useState(null);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    Dynamsoft.DWT.RegisterEvent("OnWebTwainReady", () => {
      let obj = Dynamsoft.DWT.GetWebTwain("dwtcontrolContainer");
      if (obj) {
        setDWObject(obj);
        setPageCount(obj.HowManyImagesInBuffer);
        console.log("Scanner prêt !");
      }
    });

    Dynamsoft.DWT.Containers = [
      { ContainerId: "dwtcontrolContainer", Width: 600, Height: 400 },
    ];
    Dynamsoft.DWT.Load();
  }, []);

  const acquireImage = () => {
    if (DWObject) {
      // Vérifier si un scanner est disponible
      if (DWObject.SourceCount === 0) {
        alert("❌ Scan non disponible. Aucun scanner détecté !");
        return;
      }

      DWObject.AcquireImage({
        IfShowUI: true,
        IfFeederEnabled: false,
        PixelType: 2, // 0: B&W, 1: Gray, 2: Color
        Resolution: 300,
      });
      setTimeout(() => setPageCount(DWObject.HowManyImagesInBuffer), 1000);
    } else {
      alert("❌ Le module de scan n’est pas prêt !");
    }
  };

  const removePage = (index) => {
    if (DWObject && index >= 0 && index < DWObject.HowManyImagesInBuffer) {
      DWObject.RemoveImage(index);
      setPageCount(DWObject.HowManyImagesInBuffer);
    }
  };

  const clearAll = () => {
    if (DWObject) {
      DWObject.RemoveAllImages();
      setPageCount(0);
    }
  };

  const saveMultiPagePDF = async () => {
    if (!DWObject || DWObject.HowManyImagesInBuffer === 0) {
      alert("Aucune image scannée !");
      return;
    }

    let indices = [];
    for (let i = 0; i < DWObject.HowManyImagesInBuffer; i++) {
      indices.push(i);
    }

    DWObject.ConvertToBlob(
      indices,
      Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,
      (result) => {
        const file = new File([result], "scan-multipage.pdf", {
          type: "application/pdf",
        });

        let formData = new FormData();
        formData.append("file", file);

        axios
          .post(`${API_BASE_URL}/upload-scan`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          ; ((res) => {
            alert("✅ PDF multipage enregistré avec succès !");
            console.log(res.data);
          })
          .catch((err) => {
            console.error(err);
            alert("❌ Erreur lors de l'enregistrement !");
          });
      },
      (err) => {
        console.error("Erreur conversion PDF :", err);
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 shadow">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100-header bg-indigo-600 text-white">
          <h4 className="mb-0">📑 Scanner un document</h4>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100-body">
          {/* Zone TWAIN */}
          <div id="dwtcontrolContainer" className="border border-slate-200 mb-3"></div>

          {/* Boutons d’action */}
          <div className="mb-3 flex gap-2">
            <button className="bg-indigo-600-600 hover:bg-indigo-600-700 text-white px-4 py-2 rounded-lg" onClick={acquireImage}>
              📄 Scanner une page
            </button>
            <button className="btn btn-success" onClick={saveMultiPagePDF}>
              💾 Enregistrer PDF multipage
            </button>
            <button className="btn btn-danger" onClick={clearAll}>
              🗑️ Tout supprimer
            </button>
          </div>

          {/* Liste des pages */}
          <h5>Pages scannées : {pageCount}</h5>
          {pageCount > 0 ? (
            <table className="w-full border-collapse w-full border-collapse-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: pageCount }, (_, i) => (
                  <tr key={i}>
                    <td>Page {i + 1}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removePage(i)}
                      >
                        ❌ Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Aucune page scannée.</p>
          )}
        </div>
      </div>
    </div>
  );
}
