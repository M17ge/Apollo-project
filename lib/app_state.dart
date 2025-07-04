import 'package:flutter/material.dart';
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:csv/csv.dart';
import 'package:synchronized/synchronized.dart';
import 'flutter_flow/flutter_flow_util.dart';

class FFAppState extends ChangeNotifier {
  static FFAppState _instance = FFAppState._internal();

  factory FFAppState() {
    return _instance;
  }

  FFAppState._internal();

  static void reset() {
    _instance = FFAppState._internal();
  }

  Future initializePersistedState() async {
    secureStorage = FlutterSecureStorage();
    await _safeInitAsync(() async {
      _totalPrice =
          await secureStorage.getDouble('ff_totalPrice') ?? _totalPrice;
    });
    await _safeInitAsync(() async {
      _cartItems = (await secureStorage.getStringList('ff_cartItems'))
              ?.map((x) {
                try {
                  return CartItemStruct.fromSerializableMap(jsonDecode(x));
                } catch (e) {
                  print("Can't decode persisted data type. Error: $e.");
                  return null;
                }
              })
              .withoutNulls
              .toList() ??
          _cartItems;
    });
    await _safeInitAsync(() async {
      _VATprice = await secureStorage.getDouble('ff_VATprice') ?? _VATprice;
    });
    await _safeInitAsync(() async {
      _grossPrice =
          await secureStorage.getDouble('ff_grossPrice') ?? _grossPrice;
    });
    await _safeInitAsync(() async {
      _creditInterest =
          await secureStorage.getDouble('ff_creditInterest') ?? _creditInterest;
    });
    await _safeInitAsync(() async {
      _creditPrice =
          await secureStorage.getDouble('ff_creditPrice') ?? _creditPrice;
    });
  }

  void update(VoidCallback callback) {
    callback();
    notifyListeners();
  }

  late FlutterSecureStorage secureStorage;

  /// price accumulation
  double _totalPrice = 0.0;
  double get totalPrice => _totalPrice;
  set totalPrice(double value) {
    _totalPrice = value;
    secureStorage.setDouble('ff_totalPrice', value);
  }

  void deleteTotalPrice() {
    secureStorage.delete(key: 'ff_totalPrice');
  }

  /// cart content
  List<CartItemStruct> _cartItems = [];
  List<CartItemStruct> get cartItems => _cartItems;
  set cartItems(List<CartItemStruct> value) {
    _cartItems = value;
    secureStorage.setStringList(
        'ff_cartItems', value.map((x) => x.serialize()).toList());
  }

  void deleteCartItems() {
    secureStorage.delete(key: 'ff_cartItems');
  }

  void addToCartItems(CartItemStruct value) {
    cartItems.add(value);
    secureStorage.setStringList(
        'ff_cartItems', _cartItems.map((x) => x.serialize()).toList());
  }

  void removeFromCartItems(CartItemStruct value) {
    cartItems.remove(value);
    secureStorage.setStringList(
        'ff_cartItems', _cartItems.map((x) => x.serialize()).toList());
  }

  void removeAtIndexFromCartItems(int index) {
    cartItems.removeAt(index);
    secureStorage.setStringList(
        'ff_cartItems', _cartItems.map((x) => x.serialize()).toList());
  }

  void updateCartItemsAtIndex(
    int index,
    CartItemStruct Function(CartItemStruct) updateFn,
  ) {
    cartItems[index] = updateFn(_cartItems[index]);
    secureStorage.setStringList(
        'ff_cartItems', _cartItems.map((x) => x.serialize()).toList());
  }

  void insertAtIndexInCartItems(int index, CartItemStruct value) {
    cartItems.insert(index, value);
    secureStorage.setStringList(
        'ff_cartItems', _cartItems.map((x) => x.serialize()).toList());
  }

  /// VAT percentage value
  double _VATprice = 0.0;
  double get VATprice => _VATprice;
  set VATprice(double value) {
    _VATprice = value;
    secureStorage.setDouble('ff_VATprice', value);
  }

  void deleteVATprice() {
    secureStorage.delete(key: 'ff_VATprice');
  }

  /// VAT plus price
  double _grossPrice = 0.0;
  double get grossPrice => _grossPrice;
  set grossPrice(double value) {
    _grossPrice = value;
    secureStorage.setDouble('ff_grossPrice', value);
  }

  void deleteGrossPrice() {
    secureStorage.delete(key: 'ff_grossPrice');
  }

  /// Interest gained of credit
  double _creditInterest = 0.0;
  double get creditInterest => _creditInterest;
  set creditInterest(double value) {
    _creditInterest = value;
    secureStorage.setDouble('ff_creditInterest', value);
  }

  void deleteCreditInterest() {
    secureStorage.delete(key: 'ff_creditInterest');
  }

  /// interest plus price
  double _creditPrice = 0.0;
  double get creditPrice => _creditPrice;
  set creditPrice(double value) {
    _creditPrice = value;
    secureStorage.setDouble('ff_creditPrice', value);
  }

  void deleteCreditPrice() {
    secureStorage.delete(key: 'ff_creditPrice');
  }
}

void _safeInit(Function() initializeField) {
  try {
    initializeField();
  } catch (_) {}
}

Future _safeInitAsync(Function() initializeField) async {
  try {
    await initializeField();
  } catch (_) {}
}

extension FlutterSecureStorageExtensions on FlutterSecureStorage {
  static final _lock = Lock();

  Future<void> writeSync({required String key, String? value}) async =>
      await _lock.synchronized(() async {
        await write(key: key, value: value);
      });

  void remove(String key) => delete(key: key);

  Future<String?> getString(String key) async => await read(key: key);
  Future<void> setString(String key, String value) async =>
      await writeSync(key: key, value: value);

  Future<bool?> getBool(String key) async => (await read(key: key)) == 'true';
  Future<void> setBool(String key, bool value) async =>
      await writeSync(key: key, value: value.toString());

  Future<int?> getInt(String key) async =>
      int.tryParse(await read(key: key) ?? '');
  Future<void> setInt(String key, int value) async =>
      await writeSync(key: key, value: value.toString());

  Future<double?> getDouble(String key) async =>
      double.tryParse(await read(key: key) ?? '');
  Future<void> setDouble(String key, double value) async =>
      await writeSync(key: key, value: value.toString());

  Future<List<String>?> getStringList(String key) async =>
      await read(key: key).then((result) {
        if (result == null || result.isEmpty) {
          return null;
        }
        return CsvToListConverter()
            .convert(result)
            .first
            .map((e) => e.toString())
            .toList();
      });
  Future<void> setStringList(String key, List<String> value) async =>
      await writeSync(key: key, value: ListToCsvConverter().convert([value]));
}
