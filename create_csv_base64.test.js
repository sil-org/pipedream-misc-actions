import assert from "node:assert/strict";
import { describe, it } from "node:test";

globalThis.defineComponent = (config) => config;

const { default: component } = await import("./create_csv_base64.js");

const payrollData = [
  {
    EmployeeID: "E-1001",
    FirstName: "Sarah",
    LastName: "Nguyen",
    Department: "Engineering",
    PayPeriod: "2026-02",
    HoursWorked: "160",
    HourlyRate: "52.50",
    GrossPay: "8400.00",
    Currency: "USD",
    Status: "Active",
  },
  {
    EmployeeID: "E-1002",
    FirstName: "Michael",
    LastName: "Rodriguez",
    Department: "Finance",
    PayPeriod: "2026-02",
    HoursWorked: "152",
    HourlyRate: "48.00",
    GrossPay: "7296.00",
    Currency: "USD",
    Status: "Active",
  },
  {
    EmployeeID: "E-1003",
    FirstName: "Amina",
    LastName: "Hassan",
    Department: "Operations",
    PayPeriod: "2026-02",
    HoursWorked: "0",
    HourlyRate: "45.00",
    GrossPay: "0.00",
    Currency: "USD",
    Status: "On Leave",
  },
];

describe("Create CSV Base64", () => {
  it("should generate a base64-encoded CSV from payroll data", async () => {
    component.data = payrollData;
    component.filename = "payroll.csv";

    const response = await component.run({
      steps: { trigger: {} },
      $: {},
    });

    assert.equal(response.filename, "payroll.csv");
    assert.equal(response.rowCount, 3);
    assert.ok(response.base64);
    assert.ok(response.base64.length > 0);
    assert.ok(response.sizeBytes > 0);

    const decodedCsv = Buffer.from(response.base64, "base64").toString("utf8");

    assert.ok(decodedCsv.includes("EmployeeID"));
    assert.ok(decodedCsv.includes("FirstName"));
    assert.ok(decodedCsv.includes("GrossPay"));
    assert.ok(decodedCsv.includes("Amina"));
  });

  it("should correctly derive CSV columns from object keys", async () => {
    component.data = payrollData;
    component.filename = "columns.csv";

    const response = await component.run({
      steps: { trigger: {} },
      $: {},
    });

    assert.deepEqual(response.columns, [
      "EmployeeID",
      "FirstName",
      "LastName",
      "Department",
      "PayPeriod",
      "HoursWorked",
      "HourlyRate",
      "GrossPay",
      "Currency",
      "Status",
    ]);
  });

  it("should throw an error when data is empty", async () => {
    component.data = [];
    component.filename = "empty.csv";

    await assert.rejects(async () => {
      await component.run({
        steps: { trigger: {} },
        $: {},
      });
    });
  });
});
