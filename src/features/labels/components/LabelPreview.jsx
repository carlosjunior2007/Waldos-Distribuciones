import BarcodeSvg from "./BarcodeSvg";

export function LabelPreviewContent({
  form,
  client,
  product,
  companyOptions,
  elementId,
}) {
  const widthMm = Number(form.ancho_mm || 100);
  const heightMm = Number(form.alto_mm || 75);

  return (
    <div
      id={elementId}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        background: "#ffffff",
        color: "#0f172a",
        border: "1px solid #d9e0e7",
        borderRadius: "14px",
        padding: "7mm",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "5mm",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "5mm",
              fontWeight: 700,
              lineHeight: 1.05,
              wordBreak: "break-word",
            }}
          >
            {product?.nombre || "Producto"}
          </div>

          {form.codigo ? (
            <div style={{ marginTop: "2.5mm", fontSize: "3.5mm", fontWeight: 700 }}>
              Código: {form.codigo}
            </div>
          ) : null}

          {form.texto_extra ? (
            <div
              style={{
                marginTop: "1mm",
                fontSize: "3.5mm",
                lineHeight: 1.2,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontWeight: 700,
              }}
            >
              {form.texto_extra}
            </div>
          ) : null}

          {client?.nombre ? (
            <div style={{ marginTop: "1mm", fontSize: "3.5mm", fontWeight: 700 }}>
              Cliente: {client.nombre}
            </div>
          ) : null}

          {client?.numero ? (
            <div style={{ marginTop: "1mm", fontSize: "3.5mm", fontWeight: 700 }}>
              Tel: {client.numero}
            </div>
          ) : null}

          {client?.correo ? (
            <div
              style={{
                marginTop: "1mm",
                fontSize: "3.5mm",
                wordBreak: "break-word",
                fontWeight: 700,
              }}
            >
              {client.correo}
            </div>
          ) : null}
        </div>

        {client?.logo ? (
          <div style={{ width: "22mm", textAlign: "right", flexShrink: 0 }}>
            <img
              src={client.logo}
              alt="Logo cliente"
              style={{
                maxWidth: "22mm",
                maxHeight: "16mm",
                objectFit: "contain",
                marginLeft: "auto",
              }}
            />
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "2mm" }}>
        {form.codigo_barras ? (
          <div
            style={{
              margin: "3mm auto",
              width: "80%",
              minHeight: "26mm",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <BarcodeSvg value={form.codigo_barras} />
          </div>
        ) : null}

        {(companyOptions.showCompanyLogo || companyOptions.showCompanyName) && (
          <div
            style={{
              marginTop: "3mm",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "3mm",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
              {companyOptions.showCompanyLogo && companyOptions.companyLogo ? (
                <img
                  src={companyOptions.companyLogo}
                  alt="Logo empresa"
                  style={{
                    width: "10mm",
                    height: "10mm",
                    objectFit: "contain",
                  }}
                />
              ) : null}

              {companyOptions.showCompanyName ? (
                <span style={{ fontSize: "2.8mm", fontWeight: 700 }}>
                  {companyOptions.companyName}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LabelPreview({ form, client, product, companyOptions }) {
  return (
    <div className="rounded-[24px] border border-border bg-background p-4">
      <p className="mb-3 text-sm font-semibold text-text-primary">
        Vista previa
      </p>

      <div className="overflow-auto rounded-2xl border border-dashed border-border bg-white p-6">
        <div className="flex justify-center">
          <LabelPreviewContent
            form={form}
            client={client}
            product={product}
            companyOptions={companyOptions}
            elementId="label-preview-print"
          />
        </div>
      </div>
    </div>
  );
}