export function formatPhone(phone: string): string {
  const raw = phone.trim();
  let cleaned = raw.replace(/\D/g, "");

  if (raw.startsWith("+62")) {
    cleaned = `62${cleaned.slice(2)}`;
  }

  if (cleaned.startsWith("0")) {
    cleaned = `62${cleaned.slice(1)}`;
  }

  if (!cleaned.startsWith("62")) {
    cleaned = `62${cleaned}`;
  }

  return cleaned;
}

export function validatePhone(phone: string): {
  valid: boolean;
  message: string;
} {
  const cleaned = phone.replace(/\D/g, "");

  if (!cleaned) {
    return { valid: false, message: "Nomor HP wajib diisi" };
  }

  const hasValidPrefix = cleaned.startsWith("08") || cleaned.startsWith("628") || phone.startsWith("+628");
  if (!hasValidPrefix) {
    return {
      valid: false,
      message: "Nomor HP harus diawali 08 atau +62",
    };
  }

  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 10 || digitsOnly.length > 13) {
    return {
      valid: false,
      message: "Nomor HP tidak valid (10-13 digit)",
    };
  }

  const prefix4digit = digitsOnly.startsWith("0") ? digitsOnly.slice(0, 4) : `0${digitsOnly.slice(2, 5)}`;

  const num = parseInt(prefix4digit, 10);
  const validOperator =
    (num >= 811 && num <= 819) ||
    (num >= 821 && num <= 823) ||
    (num >= 851 && num <= 853) ||
    (num >= 812 && num <= 813) ||
    (num >= 814 && num <= 815) ||
    (num >= 816 && num <= 816) ||
    (num >= 855 && num <= 858) ||
    (num >= 817 && num <= 819) ||
    (num >= 859 && num <= 877) ||
    (num >= 878 && num <= 879) ||
    (num >= 895 && num <= 899) ||
    (num >= 881 && num <= 889) ||
    (num >= 831 && num <= 839) ||
    (num >= 838 && num <= 838);

  if (!validOperator) {
    return {
      valid: false,
      message: "Nomor HP bukan operator Indonesia yang valid",
    };
  }

  return { valid: true, message: "" };
}

export function displayPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const local = cleaned.startsWith("62") ? `0${cleaned.slice(2)}` : cleaned;

  if (local.length === 11 || local.length === 12) {
    return `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`;
  }
  return local;
}
