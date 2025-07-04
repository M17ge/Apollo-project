import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Product & Stock = Stock & Product
class StockRecord extends FirestoreRecord {
  StockRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "StockId" field.
  String? _stockId;
  String get stockId => _stockId ?? '';
  bool hasStockId() => _stockId != null;

  // "ItemName" field.
  String? _itemName;
  String get itemName => _itemName ?? '';
  bool hasItemName() => _itemName != null;

  // "Quantity" field.
  int? _quantity;
  int get quantity => _quantity ?? 0;
  bool hasQuantity() => _quantity != null;

  // "Category" field.
  String? _category;
  String get category => _category ?? '';
  bool hasCategory() => _category != null;

  // "Price" field.
  int? _price;
  int get price => _price ?? 0;
  bool hasPrice() => _price != null;

  // "ShortDescription" field.
  String? _shortDescription;
  String get shortDescription => _shortDescription ?? '';
  bool hasShortDescription() => _shortDescription != null;

  // "LongDescription" field.
  String? _longDescription;
  String get longDescription => _longDescription ?? '';
  bool hasLongDescription() => _longDescription != null;

  // "ImageAsset" field.
  String? _imageAsset;
  String get imageAsset => _imageAsset ?? '';
  bool hasImageAsset() => _imageAsset != null;

  void _initializeFields() {
    _stockId = snapshotData['StockId'] as String?;
    _itemName = snapshotData['ItemName'] as String?;
    _quantity = castToType<int>(snapshotData['Quantity']);
    _category = snapshotData['Category'] as String?;
    _price = castToType<int>(snapshotData['Price']);
    _shortDescription = snapshotData['ShortDescription'] as String?;
    _longDescription = snapshotData['LongDescription'] as String?;
    _imageAsset = snapshotData['ImageAsset'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('Stock');

  static Stream<StockRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => StockRecord.fromSnapshot(s));

  static Future<StockRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => StockRecord.fromSnapshot(s));

  static StockRecord fromSnapshot(DocumentSnapshot snapshot) => StockRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static StockRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      StockRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'StockRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is StockRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createStockRecordData({
  String? stockId,
  String? itemName,
  int? quantity,
  String? category,
  int? price,
  String? shortDescription,
  String? longDescription,
  String? imageAsset,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'StockId': stockId,
      'ItemName': itemName,
      'Quantity': quantity,
      'Category': category,
      'Price': price,
      'ShortDescription': shortDescription,
      'LongDescription': longDescription,
      'ImageAsset': imageAsset,
    }.withoutNulls,
  );

  return firestoreData;
}

class StockRecordDocumentEquality implements Equality<StockRecord> {
  const StockRecordDocumentEquality();

  @override
  bool equals(StockRecord? e1, StockRecord? e2) {
    return e1?.stockId == e2?.stockId &&
        e1?.itemName == e2?.itemName &&
        e1?.quantity == e2?.quantity &&
        e1?.category == e2?.category &&
        e1?.price == e2?.price &&
        e1?.shortDescription == e2?.shortDescription &&
        e1?.longDescription == e2?.longDescription &&
        e1?.imageAsset == e2?.imageAsset;
  }

  @override
  int hash(StockRecord? e) => const ListEquality().hash([
        e?.stockId,
        e?.itemName,
        e?.quantity,
        e?.category,
        e?.price,
        e?.shortDescription,
        e?.longDescription,
        e?.imageAsset
      ]);

  @override
  bool isValidKey(Object? o) => o is StockRecord;
}
