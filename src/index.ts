// The Encoding
import * as utf_8 from "./codecs/utf-8.js";
// Legacy single-byte encodings
import * as ibm866 from "./codecs/single-byte/ibm866.js";
import * as iso_8859_2 from "./codecs/single-byte/iso-8859-2.js";
import * as iso_8859_3 from "./codecs/single-byte/iso-8859-3.js";
import * as iso_8859_4 from "./codecs/single-byte/iso-8859-4.js";
import * as iso_8859_5 from "./codecs/single-byte/iso-8859-5.js";
import * as iso_8859_6 from "./codecs/single-byte/iso-8859-6.js";
import * as iso_8859_7 from "./codecs/single-byte/iso-8859-7.js";
import * as iso_8859_8_i from "./codecs/single-byte/iso-8859-8-i.js";
import * as iso_8859_8 from "./codecs/single-byte/iso-8859-8.js";
import * as iso_8859_10 from "./codecs/single-byte/iso-8859-10.js";
import * as iso_8859_13 from "./codecs/single-byte/iso-8859-13.js";
import * as iso_8859_14 from "./codecs/single-byte/iso-8859-14.js";
import * as iso_8859_15 from "./codecs/single-byte/iso-8859-15.js";
import * as iso_8859_16 from "./codecs/single-byte/iso-8859-16.js";
import * as koi8_r from "./codecs/single-byte/koi8-r.js";
import * as koi8_u from "./codecs/single-byte/koi8-u.js";
import * as macintosh from "./codecs/single-byte/macintosh.js";
import * as windows_874 from "./codecs/single-byte/windows-874.js";
import * as windows_1250 from "./codecs/single-byte/windows-1250.js";
import * as windows_1251 from "./codecs/single-byte/windows-1251.js";
import * as windows_1252 from "./codecs/single-byte/windows-1252.js";
import * as windows_1253 from "./codecs/single-byte/windows-1253.js";
import * as windows_1254 from "./codecs/single-byte/windows-1254.js";
import * as windows_1255 from "./codecs/single-byte/windows-1255.js";
import * as windows_1256 from "./codecs/single-byte/windows-1256.js";
import * as windows_1257 from "./codecs/single-byte/windows-1257.js";
import * as windows_1258 from "./codecs/single-byte/windows-1258.js";
import * as x_mac_cyrillic from "./codecs/single-byte/x-mac-cyrillic.js";
// Legacy multi-byte Chinese (simplified) encodings
import * as gb18030 from "./codecs/gb18030.js";
import * as gbk from "./codecs/gbk.js";
// Legacy multi-byte Chinese (traditional) encodings
import * as big5 from "./codecs/big5.js";
// Legacy multi-byte Japanese encodings
import * as euc_jp from "./codecs/euc-jp.js";
import * as iso_2022_jp from "./codecs/iso-2022-jp.js";
import * as shift_jis from "./codecs/shift_jis.js";
// Legacy multi-byte Korean encodings
import * as euc_kr from "./codecs/euc-kr.js";
// Legacy miscellaneous encodings
import * as utf_16 from "./codecs/utf-16.js";
import * as utf_16be from "./codecs/utf-16be.js";
import * as utf_16le from "./codecs/utf-16le.js";
import * as x_user_defined from "./codecs/x-user-defined.js";
// Additional encodings
import * as utf_32 from "./codecs/utf-32.js";
import * as utf_32be from "./codecs/utf-32be.js";
import * as utf_32le from "./codecs/utf-32le.js";
import type {
  DecodeOptions,
  Decoder,
  EncodeOptions,
  Encoder,
} from "./interfaces.js";

type Encoding = keyof typeof import(".");

type CanonicalEncoding = Extract<
  Encoding,
  | "utf_8"
  | "ibm866"
  | "iso_8859_2"
  | "iso_8859_3"
  | "iso_8859_4"
  | "iso_8859_5"
  | "iso_8859_6"
  | "iso_8859_7"
  | "iso_8859_8_i"
  | "iso_8859_8"
  | "iso_8859_10"
  | "iso_8859_12"
  | "iso_8859_13"
  | "iso_8859_14"
  | "iso_8859_15"
  | "iso_8859_16"
  | "koi8_r"
  | "koi8_u"
  | "macintosh"
  | "windows_874"
  | "windows_1250"
  | "windows_1251"
  | "windows_1252"
  | "windows_1253"
  | "windows_1254"
  | "windows_1255"
  | "windows_1256"
  | "windows_1257"
  | "windows_1258"
  | "x_mac_cyrillic"
  | "gb18030"
  | "gbk"
  | "big5"
  | "euc_jp"
  | "iso_2022_jp"
  | "shift_jis"
  | "euc_kr"
  | "utf_16"
  | "utf_16le"
  | "utf_16be"
  | "x_user_defined"
  | "utf_32"
  | "utf_32le"
  | "utf_32be"
>;

type Codec<
  TEncodeOptions extends EncodeOptions = EncodeOptions,
  TDecodeOptions extends DecodeOptions = DecodeOptions,
> = {
  encode: Encoder<TEncodeOptions>;
  decode: Decoder<TDecodeOptions>;
};

// Aliases from https://encoding.spec.whatwg.org/#names-and-labels
export {
  type Encoding,
  type CanonicalEncoding,
  type Codec,

  // The Encoding
  utf_8,
  utf_8 as unicode_1_1_utf_8,
  utf_8 as unicode11utf8,
  utf_8 as unicode20utf8,
  utf_8 as utf8,
  utf_8 as x_unicode20utf8,

  // Legacy single-byte encodings
  ibm866,
  ibm866 as cp866,
  ibm866 as csibm866,
  iso_8859_2,
  iso_8859_2 as csisolatin2,
  iso_8859_2 as iso_ir_101,
  iso_8859_2 as iso8859_2,
  iso_8859_2 as iso88592,
  iso_8859_2 as iso_8859_2_1987,
  iso_8859_2 as l2,
  iso_8859_2 as latin2,
  iso_8859_3,
  iso_8859_3 as csisolatin3,
  iso_8859_3 as iso_ir_109,
  iso_8859_3 as iso8859_3,
  iso_8859_3 as iso88593,
  iso_8859_3 as iso_8859_3_1988,
  iso_8859_3 as l3,
  iso_8859_3 as latin3,
  iso_8859_4,
  iso_8859_4 as csisolatin4,
  iso_8859_4 as iso_ir_110,
  iso_8859_4 as iso8859_4,
  iso_8859_4 as iso88594,
  iso_8859_4 as iso_8859_4_1988,
  iso_8859_4 as l4,
  iso_8859_4 as latin4,
  iso_8859_5,
  iso_8859_5 as csisolatincyrillic,
  iso_8859_5 as cyrillic,
  iso_8859_5 as iso_ir_144,
  iso_8859_5 as iso8859_5,
  iso_8859_5 as iso88595,
  iso_8859_5 as iso_8859_5_1988,
  iso_8859_6,
  iso_8859_6 as arabic,
  iso_8859_6 as asmo_708,
  iso_8859_6 as csiso88596e,
  iso_8859_6 as csiso88596i,
  iso_8859_6 as csisolatinarabic,
  iso_8859_6 as ecma_114,
  iso_8859_6 as iso_8859_6_e,
  iso_8859_6 as iso_8859_6_i,
  iso_8859_6 as iso_ir_127,
  iso_8859_6 as iso8859_6,
  iso_8859_6 as iso88596,
  iso_8859_6 as iso_8859_6_1987,
  iso_8859_7,
  iso_8859_7 as csisolatingreek,
  iso_8859_7 as ecma_118,
  iso_8859_7 as elot_928,
  iso_8859_7 as greek,
  iso_8859_7 as greek8,
  iso_8859_7 as iso_ir_126,
  iso_8859_7 as iso8859_7,
  iso_8859_7 as iso88597,
  iso_8859_7 as iso_8859_7_1987,
  iso_8859_7 as sun_eu_greek,
  iso_8859_8,
  iso_8859_8 as csiso88598e,
  iso_8859_8 as csisolatinhebrew,
  iso_8859_8 as hebrew,
  iso_8859_8 as iso_8859_8_e,
  iso_8859_8 as iso_ir_138,
  iso_8859_8 as iso8859_8,
  iso_8859_8 as iso88598,
  iso_8859_8 as iso_8859_8_1988,
  iso_8859_8 as visual,
  iso_8859_8_i,
  iso_8859_8_i as csiso88598i,
  iso_8859_8_i as logical,
  iso_8859_10,
  iso_8859_10 as csisolatin6,
  iso_8859_10 as iso_ir_157,
  iso_8859_10 as iso8859_10,
  iso_8859_10 as iso885910,
  iso_8859_10 as l6,
  iso_8859_10 as latin6,
  iso_8859_13,
  iso_8859_13 as iso8859_13,
  iso_8859_13 as iso885913,
  iso_8859_14,
  iso_8859_14 as iso8859_14,
  iso_8859_14 as iso885914,
  iso_8859_15,
  iso_8859_15 as csisolatin9,
  iso_8859_15 as iso8859_15,
  iso_8859_15 as iso885915,
  iso_8859_15 as l9,
  iso_8859_16,
  koi8_r,
  koi8_r as cskoi8r,
  koi8_r as koi,
  koi8_r as koi8,
  koi8_u,
  koi8_u as koi8_ru,
  macintosh,
  macintosh as csmacintosh,
  macintosh as mac,
  macintosh as x_mac_roman,
  windows_874,
  windows_874 as dos_874,
  windows_874 as iso_8859_11,
  windows_874 as iso8859_11,
  windows_874 as iso885911,
  windows_874 as tis_620,
  windows_1250,
  windows_1250 as cp1250,
  windows_1250 as x_cp1250,
  windows_1251,
  windows_1251 as cp1251,
  windows_1251 as x_cp1251,
  windows_1252,
  windows_1252 as ansi_x3_4_1968,
  windows_1252 as ascii,
  windows_1252 as cp1252,
  windows_1252 as cp819,
  windows_1252 as csisolatin1,
  windows_1252 as ibm819,
  windows_1252 as iso_8859_1,
  windows_1252 as iso_ir_100,
  windows_1252 as iso8859_1,
  windows_1252 as iso88591,
  windows_1252 as iso_8859_1_1987,
  windows_1252 as l1,
  windows_1252 as latin1,
  windows_1252 as us_ascii,
  windows_1252 as x_cp1252,
  windows_1253,
  windows_1253 as cp1253,
  windows_1253 as x_cp1253,
  windows_1254,
  windows_1254 as cp1254,
  windows_1254 as csisolatin5,
  windows_1254 as iso_8859_9,
  windows_1254 as iso_ir_148,
  windows_1254 as iso8859_9,
  windows_1254 as iso88599,
  windows_1254 as iso_8859_9_1989,
  windows_1254 as l5,
  windows_1254 as latin5,
  windows_1254 as x_cp1254,
  windows_1255,
  windows_1255 as cp1255,
  windows_1255 as x_cp1255,
  windows_1256,
  windows_1256 as cp1256,
  windows_1256 as x_cp1256,
  windows_1257,
  windows_1257 as cp1257,
  windows_1257 as x_cp1257,
  windows_1258,
  windows_1258 as cp1258,
  windows_1258 as x_cp1258,
  x_mac_cyrillic,
  x_mac_cyrillic as x_mac_ukrainian,

  // Legacy multi-byte Chinese (simplified) encodings
  gbk,
  gbk as chinese,
  gbk as csgb2312,
  gbk as csiso58gb231280,
  gbk as gb2312,
  gbk as gb_2312,
  gbk as gb_2312_80,
  gbk as iso_ir_58,
  gbk as x_gbk,
  gb18030,

  // Legacy multi-byte Chinese (traditional) encodings
  big5,
  big5 as big5_hkscs,
  big5 as cn_big5,
  big5 as csbig5,
  big5 as x_x_big5,

  // Legacy multi-byte Japanese encodings
  euc_jp,
  euc_jp as cseucpkdfmtjapanese,
  euc_jp as x_euc_jp,
  iso_2022_jp,
  iso_2022_jp as csiso2022jp,
  shift_jis,
  shift_jis as csshiftjis,
  shift_jis as ms932,
  shift_jis as ms_kanji,
  shift_jis as sjis,
  shift_jis as windows_31j,
  shift_jis as x_sjis,

  // Legacy multi-byte Korean encodings
  euc_kr,
  euc_kr as cseuckr,
  euc_kr as csksc56011987,
  euc_kr as iso_ir_149,
  euc_kr as korean,
  euc_kr as ks_c_5601_1987,
  euc_kr as ks_c_5601_1989,
  euc_kr as ksc5601,
  euc_kr as ksc_5601,
  euc_kr as windows_949,

  // Legacy miscellaneous encodings
  utf_16,
  utf_16 as utf16,
  utf_16 as unicode,
  utf_16be,
  utf_16be as unicodefffe,
  utf_16le,
  utf_16le as csunicode,
  utf_16le as iso_10646_ucs_2,
  utf_16le as ucs_2,
  utf_16le as unicodefeff,
  x_user_defined,

  // Additional encodings
  utf_32,
  utf_32be,
  utf_32le,
};
