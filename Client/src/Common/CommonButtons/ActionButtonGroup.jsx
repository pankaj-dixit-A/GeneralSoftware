import React, { useRef, useEffect, useState } from 'react';

const ActionButtonGroup = ({
  handleAddOne,
  addOneButtonEnabled,
  handleSaveOrUpdate,
  saveButtonEnabled,
  isEditMode,
  handleEdit,
  editButtonEnabled,
  handleDelete,
  deleteButtonEnabled,
  handleCancel,
  cancelButtonEnabled,
  handleBack,
  backButtonEnabled,
  permissions,
  nextTabIndex,
  component
}) => {
  const editButtonRef = useRef(null);
  const updateButtonRef = useRef(null);
  const resaleMillDropdownRef = useRef(null)
  const [focusedButton, setFocusedButton] = useState(null);

  useEffect(() => {
    if (editButtonEnabled && editButtonRef.current) {
      editButtonRef.current.focus();
    }
  }, [editButtonEnabled]);

  useEffect(() => {
    if (isEditMode && updateButtonRef.current) {
      updateButtonRef.current.focus();
    }
  }, [isEditMode]);

  const handleKeyDown = (event, handler) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handler();
      if (handler === handleAddOne || handler === handleEdit) {
        if (resaleMillDropdownRef.current) {
          resaleMillDropdownRef.current.focus();
        }
      } else if (handler === handleCancel) {
        editButtonRef.current.focus();
      } else if (handler === handleEdit) {
        updateButtonRef.current.focus();
      }
    }
  };

  const getButtonStyle = (enabled, permission, buttonKey) => ({
    backgroundColor:
      focusedButton === buttonKey
        ? "#FFEB3B"
        : enabled && permission !== "N"
          ? "blue"
          : "#F0F0F0",
    color:
      focusedButton === buttonKey
        ? "black"
        : enabled && permission !== "N"
          ? "white"
          : "#A0A0A0",
    border: "1px solid #CCC",
    borderRadius: "5px",
    cursor: enabled && permission !== "N" ? "pointer" : "not-allowed",
    width: "4%",
    height: "40px",
    fontSize: "14px",
    fontWeight: "bold",
    boxShadow:
      focusedButton === buttonKey
        ? "0px 4px 6px rgba(0, 0, 0, 0.2)"
        : "0px 2px 4px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
    outline: "none",
  });

  const handleCancelClick = () => {
    handleCancel();
    setTimeout(() => {
      if (editButtonRef.current) {
        editButtonRef.current.focus();
        setFocusedButton("edit");
      }
    }, 0);
  };

  return (
    <div
      style={{
        marginTop: "-25px",
        marginBottom: "10px",
        display: "flex"
      }}
    >
      <button
        onClick={handleAddOne}
        disabled={!addOneButtonEnabled || permissions?.canSave === "N"}
        onKeyDown={(event) => handleKeyDown(event, handleAddOne)}
        onMouseEnter={() => setFocusedButton(null)}
        onMouseLeave={() => setFocusedButton(null)}
        onFocus={() => setFocusedButton("add")}
        onBlur={() => setFocusedButton(null)}
        style={getButtonStyle(addOneButtonEnabled, permissions?.canSave, "add")}
        tabIndex={nextTabIndex}
      >
        Add
      </button>
      {isEditMode ? (
        <button
          ref={updateButtonRef}
          onClick={handleSaveOrUpdate}
          onKeyDown={(event) => handleKeyDown(event, handleSaveOrUpdate)}
          id="update"
          onMouseEnter={() => setFocusedButton(null)}
          onMouseLeave={() => setFocusedButton(null)}
          onFocus={() => setFocusedButton("update")}
          onBlur={() => setFocusedButton(null)}
          style={getButtonStyle(true, "Y", "update")}
          tabIndex={nextTabIndex}
        >
          Update
        </button>
      ) : (
        <button
          onClick={handleSaveOrUpdate}
          disabled={!saveButtonEnabled || permissions?.canSave === "N"}
          onKeyDown={(event) => handleKeyDown(event, handleSaveOrUpdate)}
          id="save"
          onMouseEnter={() => setFocusedButton(null)}
          onMouseLeave={() => setFocusedButton(null)}
          onFocus={() => setFocusedButton("save")}
          onBlur={() => setFocusedButton(null)}
          style={getButtonStyle(saveButtonEnabled, permissions?.canSave, "save")}
          tabIndex={nextTabIndex}
        >
          Save
        </button>
      )}
      <button
        ref={editButtonRef}
        onClick={handleEdit}
        disabled={!editButtonEnabled || permissions?.canEdit === "N"}
        onKeyDown={(event) => handleKeyDown(event, handleEdit)}
        onMouseEnter={() => setFocusedButton(null)}
        onMouseLeave={() => setFocusedButton(null)}
        onFocus={() => setFocusedButton("edit")}
        onBlur={() => setFocusedButton(null)}
        style={getButtonStyle(editButtonEnabled, permissions?.canEdit, "edit")}
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={!deleteButtonEnabled || permissions?.canDelete === "N"}
        onKeyDown={(event) => handleKeyDown(event, handleDelete)}
        onMouseEnter={() => setFocusedButton(null)}
        onMouseLeave={() => setFocusedButton(null)}
        onFocus={() => setFocusedButton("delete")}
        onBlur={() => setFocusedButton(null)}
        style={getButtonStyle(deleteButtonEnabled, permissions?.canDelete, "delete")}
        tabIndex={nextTabIndex}
      >
        Delete
      </button>
      <button
        onClick={handleCancelClick}
        disabled={!cancelButtonEnabled}
        onKeyDown={(event) => handleKeyDown(event, handleCancelClick)}
        onMouseEnter={() => setFocusedButton(null)}
        onMouseLeave={() => setFocusedButton(null)}
        onFocus={() => setFocusedButton("cancel")}
        onBlur={() => setFocusedButton(null)}
        style={getButtonStyle(cancelButtonEnabled, "Y", "cancel")}
        tabIndex={nextTabIndex}
      >
        Cancel
      </button>
      <button
        onClick={handleBack}
        disabled={!backButtonEnabled}
        onKeyDown={(event) => handleKeyDown(event, handleBack)}
        onMouseEnter={() => setFocusedButton(null)}
        onMouseLeave={() => setFocusedButton(null)}
        onFocus={() => setFocusedButton("back")}
        onBlur={() => setFocusedButton(null)}
        style={getButtonStyle(backButtonEnabled, "Y", "back")}
        tabIndex={nextTabIndex}
      >
        Back
      </button>
        {component}
    </div>
  );
};

export default ActionButtonGroup;
