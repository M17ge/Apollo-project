import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import 'edit_profile_auth2_widget.dart' show EditProfileAuth2Widget;
import 'package:flutter/material.dart';

class EditProfileAuth2Model extends FlutterFlowModel<EditProfileAuth2Widget> {
  ///  Local state fields for this component.
  /// Counties from Dropdown Selection
  String? dropdownSelection = 'Mombasa';

  ///  State fields for stateful widgets in this component.

  final formKey = GlobalKey<FormState>();
  // State field(s) for fullName widget.
  FocusNode? fullNameFocusNode;
  TextEditingController? fullNameTextController;
  String? Function(BuildContext, String?)? fullNameTextControllerValidator;
  // State field(s) for eMail widget.
  FocusNode? eMailFocusNode;
  TextEditingController? eMailTextController;
  String? Function(BuildContext, String?)? eMailTextControllerValidator;
  // State field(s) for mobileNumber widget.
  FocusNode? mobileNumberFocusNode;
  TextEditingController? mobileNumberTextController;
  String? Function(BuildContext, String?)? mobileNumberTextControllerValidator;
  // State field(s) for crops widget.
  FocusNode? cropsFocusNode;
  TextEditingController? cropsTextController;
  String? Function(BuildContext, String?)? cropsTextControllerValidator;
  // State field(s) for county widget.
  String? countyValue;
  FormFieldController<String>? countyValueController;
  // State field(s) for farmSize widget.
  String? farmSizeValue;
  FormFieldController<String>? farmSizeValueController;
  // State field(s) for farmDescription widget.
  FocusNode? farmDescriptionFocusNode;
  TextEditingController? farmDescriptionTextController;
  String? Function(BuildContext, String?)?
      farmDescriptionTextControllerValidator;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    fullNameFocusNode?.dispose();
    fullNameTextController?.dispose();

    eMailFocusNode?.dispose();
    eMailTextController?.dispose();

    mobileNumberFocusNode?.dispose();
    mobileNumberTextController?.dispose();

    cropsFocusNode?.dispose();
    cropsTextController?.dispose();

    farmDescriptionFocusNode?.dispose();
    farmDescriptionTextController?.dispose();
  }
}
