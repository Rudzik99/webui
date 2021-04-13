import { OnInit, Component, ViewEncapsulation, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ApplicationsService } from "../../applications.service";
import helptext from "../../../../helptext/apps/apps";
import { LocaleService } from "app/services/locale.service";
import { AppLoaderService } from "app/services/app-loader/app-loader.service";

@Component({
  selector: "manage-catalog-summary-dialog",
  styleUrls: ["./manage-catalog-summary-dialog.component.scss"],
  templateUrl: "./manage-catalog-summary-dialog.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class ManageCatalogSummaryDialog implements OnInit {
  public catalog: any;
  public statusOptions: string[] = ["All", "Healthy", "Unhealthy"];
  public trainOptions: string[] = ["All"];
  helptext = helptext;
  public selectedStatus: string = this.statusOptions[0];
  public selectedTrain: string = this.trainOptions[0];
  public filteredItems: any[] = [];
  public catalogItems: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ManageCatalogSummaryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected localeService: LocaleService,
    private loader: AppLoaderService,
    private appService: ApplicationsService
  ) {
    this.catalog = data;
  }

  ngOnInit() {
    this.appService.getCatItems(this.catalog.label).subscribe((evt) => {
      this.catalogItems = [];
      this.trainOptions = ["All"];
      Object.keys(evt).forEach((trainKey) => {
        const train = evt[trainKey];
        this.trainOptions.push(trainKey);
        Object.keys(train).forEach((appKey) => {
          const app = train[appKey];
          Object.keys(app.versions).forEach((versionKey) => {
            const version = app.versions[versionKey];
            version["train"] = trainKey;
            version["app"] = appKey;
            this.catalogItems.push(version);
          });
        });
      });

      this.filteredItems = this.catalogItems;
    });
  }

  onOptionChanged() {
    this.filteredItems = this.catalogItems.filter((item) => {
      let isSeletectedTrain = false;
      if (this.selectedTrain == this.trainOptions[0] || this.selectedTrain == item.train) {
        isSeletectedTrain = true;
      }

      let isSeletectedStatus = false;
      if (
        this.selectedStatus == this.statusOptions[0] ||
        (this.selectedStatus == this.statusOptions[1] && item.healthy) ||
        (this.selectedStatus == this.statusOptions[2] && !item.healthy)
      ) {
        isSeletectedStatus = true;
      }

      return isSeletectedTrain && isSeletectedStatus;
    });
  }

  versionStatusLabel(item) {
    let label = "";
    if (this.selectedStatus == this.statusOptions[0]) {
      if (item.healthy) {
        label += "(Healthy)";
      } else {
        label += "(Unhealthy)";
      }
    }

    return label;
  }
}
