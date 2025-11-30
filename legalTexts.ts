// legalTexts.ts - Strukturierte Daten für LegalModal

interface LegalSection {
  heading?: string;
  content: (string | { label: string; text: string })[];
}

interface LegalContent {
  title: string;
  subtitle?: string;
  sections: LegalSection[];
}

export const impressumContent: LegalContent = {
  title: "Impressum",
  subtitle: "Angaben gemäß § 5 TMG",
  sections: [
    {
      content: [
        { label: "Mahler Filmproduktion GmbH", text: "" },
        "Teterower Straße 8",
        "18279 Lalendorf, Ortsteil Roggow",
        "Deutschland",
      ],
    },
    {
      heading: "Vertreten durch",
      content: ["Geschäftsführerin: Anke Mahler"],
    },
    {
      heading: "Kontakt",
      content: [
        { label: "Telefon:", text: "0174 179 4167" },
        { label: "E-Mail:", text: "anke@mahler-filmproduktion.de" },
        { label: "Webseite:", text: "www.mahler-filmproduktion.de" },
      ],
    },
    {
      heading: "Registereintrag",
      content: [
        "Eintragung im Handelsregister.",
        { label: "Registergericht:", text: "Amtsgericht Potsdam" },
        { label: "Registernummer:", text: "HRB 34019 P" },
      ],
    },
    {
      heading: "Umsatzsteuer-ID",
      content: [
        "Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:",
        "DE 404242307",
      ],
    },
    {
      heading: "EU-Streitschlichtung",
      content: [
        "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/",
        "Unsere E-Mail-Adresse finden Sie oben im Impressum.",
      ],
    },
    {
      heading: "Verbraucherstreitbeilegung",
      content: [
        "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      ],
    },
  ],
};

export const datenschutzContent: LegalContent = {
  title: "Datenschutzerklärung",
  subtitle: "Stand: 27. November 2025",
  sections: [
    {
      heading: "1. Datenschutz auf einen Blick",
      content: [
        "Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.",
      ],
    },
    {
      heading: "Verantwortliche Stelle",
      content: [
        "Mahler Filmproduktion GmbH",
        "Anke Mahler",
        "Teterower Straße 8",
        "18279 Lalendorf",
        { label: "E-Mail:", text: "anke@mahler-filmproduktion.de" },
      ],
    },
    {
      heading: "2. Hosting",
      content: [
        "Wir hosten unsere Website bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.",
        "Vercel ist eine Cloud-Plattform, über die wir unsere Webanwendung bereitstellen. Wenn Sie unsere Website besuchen, werden Ihre IP-Adresse und weitere technische Daten (Browser, Betriebssystem) an die Server von Vercel übertragen. Dies ist technisch notwendig, um Ihnen die Website anzuzeigen.",
      ],
    },
    {
      heading: "3. Datensicherheit",
      content: [
        "Wir nutzen aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung.",
      ],
    },
    {
      heading: "4. Datenerfassung auf dieser Website",
      content: [
        { label: "Firebase:", text: "Wir nutzen Firebase (Authentication & Firestore) für die Benutzerverwaltung und Datenspeicherung. Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland." },
        { label: "Authentication:", text: "Wenn Sie sich registrieren oder anmelden, werden Ihre E-Mail-Adresse und ggf. Ihr Name gespeichert, um Ihren Zugang zu verwalten." },
        { label: "Firestore Database:", text: "Wir speichern Ihren Credit-Stand, Ihre Abo-Statusinformationen und Metadaten zu Ihren Sitzungen." },
      ],
    },
    {
      heading: "Zahlungsabwicklung",
      content: [
        "Wir wickeln Zahlungen über den Dienstleister Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland, ab.",
        "Wir selbst speichern keine Kreditkartendaten. Diese werden direkt an Stripe übermittelt.",
        "Weitere Informationen: https://stripe.com/de/privacy",
      ],
    },
    {
      heading: "5. Nutzung von KI-Diensten",
      content: [
        "Zur Bereitstellung unserer Kernfunktion (Visualisierung von Räumen) leiten wir Daten an spezialisierte KI-Dienstleister weiter. Dies erfolgt ausschließlich auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) durch Nutzung der \"Generieren\"-Funktion.",
        { label: "fal.ai (Bildgenerierung):", text: "Das von Ihnen hochgeladene Raumfoto, das Musterfoto und Ihre Text-Hinweise werden zur Generierung des visualisierten Bildes übermittelt." },
        { label: "x.ai (Textverarbeitung):", text: "Ihre Textbeschreibung des Raumes wird zur Verbesserung der Anweisungen an die Bild-KI übermittelt." },
      ],
    },
    {
      heading: "6. Verarbeitung von Kundenbildern (Pro-Abo)",
      content: [
        "Bei der gewerblichen Nutzung des Pro-Abos können Raumausstatter und Interior Designer Bilder ihrer Kunden zur Visualisierung verwenden.",
        { label: "Rechtsgrundlage:", text: "Die Verarbeitung erfolgt auf Basis der Einwilligung des Endkunden (Art. 6 Abs. 1 lit. a DSGVO), die der gewerbliche Nutzer selbstständig einholt." },
        { label: "Keine Speicherung:", text: "stoffanprobe.de speichert Kundenbilder, Einwilligungen und personenbezogene Kundendaten NICHT auf seinen Servern. Alle Daten verbleiben temporär im Browser des Nutzers." },
        { label: "Datenübertragung:", text: "Zur Bildgenerierung werden die Raumfotos an den KI-Dienstleister fal.ai übermittelt. Dies erfolgt nur bei aktiver Nutzung der Generieren-Funktion." },
        { label: "Verantwortlichkeit:", text: "Der gewerbliche Nutzer ist selbst Verantwortlicher im Sinne der DSGVO für die Verarbeitung der Daten seiner Kunden. stoffanprobe.de stellt lediglich die technische Infrastruktur bereit." },
        { label: "Archivierungspflicht:", text: "Der gewerbliche Nutzer ist verpflichtet, Einwilligungserklärungen und relevante Daten in seinem eigenen System DSGVO-konform zu archivieren, bevor er die Sitzung beendet." },
      ],
    },
    {
      heading: "7. Ihre Rechte",
      content: [
        "Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.",
        "Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.",
      ],
    },
  ],
};

export const agbContent: LegalContent = {
  title: "Allgemeine Geschäftsbedingungen",
  subtitle: "Mahler Filmproduktion GmbH – Stand: 27. November 2025",
  sections: [
    {
      heading: "1. Geltungsbereich",
      content: [
        "Diese AGB gelten für die Nutzung der Web-Applikation \"stoffanprobe.de\" und aller damit verbundenen Dienste.",
        "Abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.",
      ],
    },
    {
      heading: "2. Leistungsgegenstand",
      content: [
        "Der Anbieter stellt eine Software-as-a-Service (SaaS) Lösung zur Verfügung, die es Nutzern ermöglicht, mittels Künstlicher Intelligenz (KI) Fotos von Räumen mit neuen Oberflächen (Stoffen, Farben, Tapeten) zu visualisieren.",
        { label: "Haftungsausschluss für KI-Ergebnisse:", text: "Der Nutzer nimmt zur Kenntnis, dass die erzeugten Bilder durch eine KI generiert werden (Simulation). Sie stellen keine verbindliche Farbwiedergabe, Maßhaltigkeit oder technische Machbarkeit dar. Die Ergebnisse dienen ausschließlich der Inspiration und Visualisierung." },
      ],
    },
    {
      heading: "3. Registrierung und Konto",
      content: [
        "Für die Nutzung der Dienste ist eine Registrierung erforderlich.",
        "Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und vor dem Zugriff Dritter zu schützen.",
      ],
    },
    {
      heading: "4. Credits und Abonnements",
      content: [
        { label: "Credits:", text: "Die Erstellung von Bildern wird in \"Credits\" abgerechnet." },
        { label: "Monats-Abonnement:", text: "Der Nutzer erhält monatlich ein Kontingent an Credits. Nicht genutzte Credits aus dem Monatskontingent verfallen am Ende des Abrechnungsmonats. Das Abo verlängert sich automatisch um jeweils einen Monat, sofern es nicht gekündigt wird. Kündigung ist jederzeit zum Ende der aktuellen Laufzeit möglich." },
        { label: "Gekaufte Credit-Pakete:", text: "Diese Credits sind ab Kaufdatum 12 Monate gültig und verfallen danach. Beim Generieren werden zuerst die monatlichen Abo-Credits und erst danach die gekauften Credits verbraucht." },
      ],
    },
    {
      heading: "5. Zahlungsbedingungen",
      content: [
        "Die Zahlung erfolgt über den Dienstleister Stripe. Akzeptiert werden die dort angebotenen Zahlungsmethoden (z.B. Kreditkarte, Apple Pay, Google Pay).",
        "Die Entgelte sind sofort zur Zahlung fällig.",
      ],
    },
    {
      heading: "6. Nutzungsrechte an Inhalten",
      content: [
        { label: "Uploads:", text: "Der Nutzer behält die Rechte an seinen hochgeladenen Bildern. Er versichert, dass er über die notwendigen Rechte verfügt und keine Rechte Dritter verletzt." },
        { label: "Generierte Bilder:", text: "Der Anbieter räumt dem Nutzer an den generierten Bildern ein einfaches, zeitlich und räumlich unbeschränktes Nutzungsrecht für private und gewerbliche Zwecke ein." },
      ],
    },
    {
      heading: "7. Widerrufsrecht für Verbraucher",
      content: [
        "Der Nutzer stimmt ausdrücklich zu, dass der Anbieter mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist beginnt. Der Nutzer nimmt zur Kenntnis, dass er durch diese Zustimmung sein Widerrufsrecht mit Beginn der Ausführung des Vertrags verliert.",
      ],
    },
    {
      heading: "8. Haftungsbeschränkung",
      content: [
        "Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit.",
        "Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten, begrenzt auf den vertragstypischen, vorhersehbaren Schaden.",
        "Der Anbieter übernimmt keine Gewähr für die ständige Verfügbarkeit der KI-Dienste, da diese von Drittanbietern abhängen.",
      ],
    },
    {
      heading: "9. Datenschutz bei Kundenbildern (Pro-Abo)",
      content: [
        "Bei der Nutzung des Pro-Abos für gewerbliche Zwecke (z.B. Kundenberatung) ist der Nutzer selbst verantwortlich für die Einholung der notwendigen Einwilligungen seiner Kunden gemäß DSGVO Art. 6 Abs. 1 lit. a.",
        { label: "Verantwortlichkeit:", text: "Der gewerbliche Nutzer trägt die alleinige datenschutzrechtliche Verantwortung für die Verarbeitung personenbezogener Daten seiner Kunden (Raumfotos, Namen, Kontaktdaten)." },
        { label: "Keine dauerhafte Speicherung:", text: "stoffanprobe.de speichert Kundenbilder und Einwilligungserklärungen NICHT dauerhaft. Diese verbleiben nur temporär im Browser des Nutzers." },
        { label: "Archivierungspflicht:", text: "Der Nutzer ist verpflichtet, alle relevanten Daten (Bilder, Einwilligungen, Kundendaten) vor dem Beenden der Sitzung herunterzuladen und in seinem eigenen System DSGVO-konform zu archivieren." },
        { label: "Löschung:", text: "Mit dem Schließen des Browsers oder Abmelden werden alle temporären Daten unwiderruflich gelöscht." },
      ],
    },
    {
      heading: "10. Schlussbestimmungen",
      content: [
        "Es gilt das Recht der Bundesrepublik Deutschland.",
        "Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz der Mahler Filmproduktion GmbH (Amtsgericht Potsdam / Sitz in Lalendorf).",
      ],
    },
  ],
};

export const avvContent: LegalContent = {
  title: "Auftragsverarbeitungsvertrag (AVV)",
  subtitle: "gemäß Art. 28 DSGVO – Stand: 30. November 2025",
  sections: [
    {
      heading: "Präambel",
      content: [
        "Dieser Auftragsverarbeitungsvertrag (nachfolgend \"AVV\") regelt die Rechte und Pflichten der Vertragsparteien im Zusammenhang mit der Verarbeitung personenbezogener Daten im Auftrag.",
      ],
    },
    {
      heading: "1. Vertragsparteien",
      content: [
        { label: "Auftraggeber:", text: "Der Nutzer der Plattform stoffanprobe.de mit aktivem Pro-Abonnement (nachfolgend \"Verantwortlicher\")" },
        { label: "Auftragnehmer:", text: "Mahler Filmproduktion GmbH, Teterower Straße 8, 18279 Lalendorf, Deutschland, vertreten durch die Geschäftsführerin Anke Mahler (nachfolgend \"Auftragsverarbeiter\")" },
      ],
    },
    {
      heading: "2. Gegenstand und Dauer der Verarbeitung",
      content: [
        { label: "Gegenstand:", text: "Die Verarbeitung von Bilddaten zur KI-gestützten Visualisierung von Räumen mit Stoffen, Tapeten und anderen Einrichtungsgegenständen." },
        { label: "Dauer:", text: "Die Verarbeitung erfolgt für die Dauer des bestehenden Pro-Abonnements. Mit Beendigung des Abonnements endet auch dieser AVV automatisch." },
      ],
    },
    {
      heading: "3. Art und Zweck der Verarbeitung",
      content: [
        "Der Auftragsverarbeiter verarbeitet personenbezogene Daten ausschließlich zum Zweck der:",
        "• Bildgenerierung mittels KI-Diensten zur Visualisierung von Raumgestaltungen",
        "• Bereitstellung der technischen Infrastruktur für den Verantwortlichen",
        "• Temporären Übermittlung an Sub-Auftragsverarbeiter (KI-Dienstleister) zur Bildgenerierung",
      ],
    },
    {
      heading: "4. Art der personenbezogenen Daten",
      content: [
        "Folgende Datenkategorien werden verarbeitet:",
        "• Raumfotos (können Abbildungen von Personen oder persönlichen Gegenständen enthalten)",
        "• Stoffmuster- und Materialfotos",
        "• Optionale Texthinweise zur Bildgenerierung",
        "• Keine direkten personenbezogenen Daten (Name, E-Mail etc.) der Endkunden werden auf den Servern des Auftragsverarbeiters gespeichert",
      ],
    },
    {
      heading: "5. Kategorien betroffener Personen",
      content: [
        "• Kunden des Verantwortlichen (Endkunden), deren Räume visualisiert werden",
        "• Personen, die ggf. auf den hochgeladenen Raumfotos abgebildet sind",
      ],
    },
    {
      heading: "6. Pflichten des Auftragsverarbeiters",
      content: [
        "Der Auftragsverarbeiter verpflichtet sich:",
        "• Daten nur auf dokumentierte Weisung des Verantwortlichen zu verarbeiten",
        "• Die Vertraulichkeit zu wahren und alle mit der Datenverarbeitung befassten Personen zur Vertraulichkeit zu verpflichten",
        "• Geeignete technische und organisatorische Maßnahmen zu treffen",
        "• Den Verantwortlichen bei der Erfüllung seiner Pflichten zu unterstützen",
        "• Nach Beendigung der Verarbeitung alle Daten zu löschen oder zurückzugeben",
        "• Dem Verantwortlichen alle erforderlichen Informationen zum Nachweis der Einhaltung seiner Pflichten zur Verfügung zu stellen",
      ],
    },
    {
      heading: "7. Sub-Auftragsverarbeiter",
      content: [
        "Der Auftragsverarbeiter bedient sich folgender Sub-Auftragsverarbeiter:",
        { label: "fal.ai (fal, Inc.):", text: "Bildgenerierung mittels KI. Sitz: USA. Die Datenübermittlung erfolgt auf Grundlage von Standardvertragsklauseln (SCCs)." },
        { label: "x.ai Corp.:", text: "Textverarbeitung zur Optimierung von Bildanweisungen. Sitz: USA. Die Datenübermittlung erfolgt auf Grundlage von Standardvertragsklauseln (SCCs)." },
        { label: "Vercel Inc.:", text: "Hosting der Webanwendung. Sitz: USA. Die Datenübermittlung erfolgt auf Grundlage von Standardvertragsklauseln (SCCs)." },
        { label: "Google Ireland Limited (Firebase):", text: "Authentifizierung und Datenbankdienste. Sitz: Irland." },
        "Der Auftragsverarbeiter informiert den Verantwortlichen über beabsichtigte Änderungen in Bezug auf Sub-Auftragsverarbeiter.",
      ],
    },
    {
      heading: "8. Technische und organisatorische Maßnahmen (TOMs)",
      content: [
        "Der Auftragsverarbeiter gewährleistet folgende Schutzmaßnahmen:",
        { label: "Vertraulichkeit:", text: "• SSL/TLS-Verschlüsselung aller Datenübertragungen • Zugangskontrollen zu Systemen und Daten • Authentifizierung über Firebase Authentication" },
        { label: "Integrität:", text: "• Keine dauerhafte Speicherung von Kundenbildern auf eigenen Servern • Temporäre Verarbeitung nur im Browser des Nutzers • Protokollierung von Zugriffen" },
        { label: "Verfügbarkeit:", text: "• Hosting bei professionellem Cloud-Anbieter (Vercel) • Regelmäßige Backups der Systemkonfiguration • Schnelle Wiederherstellbarkeit" },
        { label: "Belastbarkeit:", text: "• Skalierbare Infrastruktur • Ausfallsichere Architektur" },
      ],
    },
    {
      heading: "9. Rechte der betroffenen Personen",
      content: [
        "Der Auftragsverarbeiter unterstützt den Verantwortlichen bei der Erfüllung seiner Pflichten gegenüber den betroffenen Personen, insbesondere bei:",
        "• Auskunftsrechten (Art. 15 DSGVO)",
        "• Berichtigungsrechten (Art. 16 DSGVO)",
        "• Löschungsrechten (Art. 17 DSGVO)",
        "• Einschränkung der Verarbeitung (Art. 18 DSGVO)",
        "• Datenübertragbarkeit (Art. 20 DSGVO)",
        "• Widerspruchsrecht (Art. 21 DSGVO)",
      ],
    },
    {
      heading: "10. Löschung und Rückgabe von Daten",
      content: [
        "Nach Beendigung der Auftragsverarbeitung werden alle personenbezogenen Daten wie folgt behandelt:",
        "• Raumfotos: Keine dauerhafte Speicherung – verbleiben temporär im Browser und werden bei Sitzungsende gelöscht",
        "• KI-Dienste: Bildübermittlung erfolgt nur zur Generierung, keine dauerhafte Speicherung durch den Auftragsverarbeiter",
        "• Nutzerkonten: Kontodaten werden auf Wunsch des Verantwortlichen gelöscht",
        "Die Bilder werden NICHT für KI-Training oder andere Zwecke verwendet.",
      ],
    },
    {
      heading: "11. Kontrollrechte",
      content: [
        "Der Verantwortliche ist berechtigt, sich von der Einhaltung dieses AVV zu überzeugen. Der Auftragsverarbeiter verpflichtet sich, dem Verantwortlichen auf Anfrage alle erforderlichen Informationen zur Verfügung zu stellen.",
        "Inspektionen und Audits sind nach vorheriger Ankündigung möglich.",
      ],
    },
    {
      heading: "12. Haftung",
      content: [
        "Der Auftragsverarbeiter haftet gegenüber dem Verantwortlichen für Schäden, die durch eine nicht dieser Vereinbarung oder den Weisungen des Verantwortlichen entsprechende Verarbeitung verursacht werden.",
        "Die Haftung richtet sich im Übrigen nach den gesetzlichen Bestimmungen und den Allgemeinen Geschäftsbedingungen.",
      ],
    },
    {
      heading: "13. Schlussbestimmungen",
      content: [
        "Dieser AVV unterliegt dem Recht der Bundesrepublik Deutschland.",
        "Änderungen und Ergänzungen dieses AVV bedürfen der Schriftform.",
        "Sollten einzelne Bestimmungen dieses AVV unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.",
        { label: "Kontakt für Datenschutzanfragen:", text: "anke@mahler-filmproduktion.de" },
      ],
    },
    {
      heading: "Abschluss des AVV",
      content: [
        "Dieser AVV wird durch die Nutzung des Pro-Abonnements automatisch wirksam. Mit der Buchung eines Pro-Abonnements bestätigt der Verantwortliche die Kenntnisnahme und Anerkennung dieses AVV.",
      ],
    },
  ],
};
